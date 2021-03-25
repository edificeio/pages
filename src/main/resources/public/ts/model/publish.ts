import { Eventer } from 'entcore-toolkit';
import http from 'axios';
import { model, notify } from 'entcore';
import { _ } from 'entcore';
import { Website } from './website';

export class Group {
    id: string;
    roles: string[];
    name: string;
}

export class Groups {
    structureId: string;
    all: Group[];
    eventer: Eventer;

    constructor(structureId: string) {
        this.structureId = structureId;
        this.eventer = new Eventer();
    }

    async sync(): Promise<any> {
        let groups = await http.get('/appregistry/groups/roles?structureId=' + this.structureId);
        this.all = _.map(groups.data, (group) => {
            group.structureId = this.structureId;
            return group;
        });
        this.eventer.trigger('sync');
    }
}

export class Structure {
    groups: Groups;
    id: string;

    constructor(id: string) {
        this.id = id;
        this.groups = new Groups(this.id);
    }

    async sync() {
        await this.groups.sync();
    }

    async publishForGroup(website: Website, group: Group) {
        if (!website.published) {
            website.published = {};
        }
        if (!website.published[this.id]) {
            await this.makeApplication(website);
            this.addRoleForGroup(website, group);
        }
        else {
            this.addRoleForGroup(website, group);
        }
    }

    async makeApplication(website: Website) {
        let icon = "/img/illustrations/pages.svg"
        if (website.icon) {
            icon = website.icon + '?thumbnail=150x150'
        }

        try {
            let response = await http.post('/appregistry/application/external?structureId=' + this.id, {
                grantType: "authorization_code",
                displayName: website.title,
                secret: "",
                address: website.url({ relative: true }),
                icon: icon,
                target: "",
                appLocked : true,
                scope: "",
                name: website.title + " - " + this.id
            });

            let newApp = response.data;

            website.published[this.id] = {
                role: { id: newApp.roleId },
                groups: [],
                application: { id: newApp.id }
            };
        }
        catch (e) {
            notify.error('app.notify.e409');
        }
    }

    async addRoleForGroup(website: Website, group: Group) {
        let roleId = website.published[this.id].role.id;
        await http.put('/appregistry/authorize/group/' + group.id + '/role/' + roleId);
        group.roles.push(roleId);
        website.published[this.id].groups.push(group);
        website.save();
    }

    async removeRoleForGroup(website: Website, group: Group) {
        let roleId = website.published[this.id].role.id;
        await http.delete('/appregistry/authorize/group/' + group.id + '/role/' + roleId);
        group.roles = _.filter(group.roles, function (r) { return r.id !== roleId; });
        website.published[this.id].groups = _.filter(website.published[this.id].groups,  (grp) => grp.id !== group.id);
        website.save();
    }
}

export class Structures {
    all: Structure[];

    async sync(): Promise<any> {
        if (model.me.functions.ADMIN_LOCAL) {
            this.all = _.map(model.me.functions.ADMIN_LOCAL.scope, (id) => new Structure(id));
            for (let structure of this.all) {
                await structure.sync();
            }
        }
    }
}

export class LocalAdmin {
    static synced: boolean;
    static structures: Structures = new Structures();
}

export interface Role {
    id: string;
}

export interface Application {
    id: string;
}

export class Publication {
    role: Role;
    groups: Group[];
    application: Application;

    constructor(appData) {
        this.role = { id: appData.roleId };
        this.groups = [];
        this.application = { id: appData.id };
    }
}