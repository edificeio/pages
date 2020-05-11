import { ng } from 'entcore';
import { template } from 'entcore';
import { Website, Folders } from '../model';

export let print = ng.controller('PrintController', [
    '$scope', '$route', function ($scope, $route) {

    let params = $route.current.params;
    
    const findWebsite = async (): Promise<void> => {
        const websites = await Folders.websites();
        const website: Website = websites.find((w) => w._id === params.siteId||  w.slug === params.siteId);
        $scope.website = website;
        $scope.$apply();
    };
    
    findWebsite();
    
    setTimeout(()=>{
        const imgs = jQuery(document).find("img").toArray();
        
        for(let img of imgs){
            (img as any).onerror=(()=>{
                (img as any).error = true;
            })
        }
        
        const isComplete = (img) => {
            return img.complete || (img.context && img.context.complete);
        };
        
        $scope.printed = false;
        const it = setInterval(()=>{
            const pending = imgs.filter(img=>!(img as any).error && !isComplete(img));
            if(pending.length == 0){
                clearInterval(it);
                if(!$scope.printed){
                    $scope.printed = true;
                    window.print();
                }
            }
        },100)
    },1000);
}])