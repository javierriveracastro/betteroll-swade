// This is the start.js from swade-tools edited to cherry pick the
// features that integrate well with Betterrolls

import StatusIcon from './class/StatusIcon.js';

Hooks.on("updateActor", (actor,data,diff,userId) => {
   
    if (game.user.id==userId){ /// TODO define this or... only gm?
        let upActor=new StatusIcon(actor,'actor',data);
        upActor.checkAllStatus();
    }
   
   
});

Hooks.on("createToken",(scene,token,diff,userId)=>{
    if (game.user.id==userId){
    let upToken=new StatusIcon(token,'token',false);
    upToken.createTokenCheck();
    }
   
})

Hooks.on('updateToken', (scene, token, data, options, userId) => {
    if (game.user.id==userId){
      //  console.log(token);
   let upToken=new StatusIcon(token,'token',data)
    upToken.checkAllStatus();
    }
   
});
