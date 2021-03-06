import * as MODULE from "../MaterialDeck.js";
import {streamDeck} from "../MaterialDeck.js";

export class MacroControl{
    constructor(){
        this.active = false;
        this.offset = 0;
    }

    async updateAll(){
        if (this.active == false) return;
        for (let i=0; i<32; i++){   
            let data = streamDeck.buttonContext[i];
            if (data == undefined || data.action != 'macro') continue;
            await this.update(data.settings,data.context);
        }
    }

    update(settings,context){
        this.active = true;
        let mode = settings.macroMode;
        let displayName = settings.displayName;
        let macroNumber = settings.macroNumber;
        let background = settings.background;
        let icon = false;
        if (settings.displayIcon) icon = true;
        let ringColor = "#000000";
        let ring = 0;
        if(macroNumber == undefined || isNaN(parseInt(macroNumber))){
            macroNumber = 0;
        }
        if (mode == undefined) mode = 'hotbar';
        if (displayName == undefined) displayName = false;
        if (background == undefined) background = '#000000';

        macroNumber = parseInt(macroNumber);
        
        if (mode == 'macroBoard') {  //Macro board
            let name = "";
            let src = ''; 
            if (settings.macroBoardMode == 'offset') {  //Offset
                let ringOffColor = settings.offRing;
                if (ringOffColor == undefined) ringOffColor = '#000000';

                let ringOnColor = settings.onRing;
                if (ringOnColor == undefined) ringOnColor = '#00FF00';

                let macroOffset = parseInt(settings.macroOffset);
                if (macroOffset == undefined || isNaN(macroOffset)) macroOffset = 0;
                
                if (macroOffset == parseInt(this.offset)) ringColor = ringOnColor;
                else ringColor = ringOffColor;

                ring = 2;
            }
            else { //Execute macro
                macroNumber += this.offset - 1;
                if (macroNumber < 0) macroNumber = 0;
                var macroId = game.settings.get(MODULE.moduleName,'macroSettings').macros[macroNumber];
                background = game.settings.get(MODULE.moduleName,'macroSettings').color[macroNumber];
                
                if (background == undefined) background = '#000000';
                src = "";
                if (macroId != undefined){
                    let macro = game.macros._source.find(p => p._id == macroId);
                    if (macro != undefined) {
                        name += macro.name;
                        src += macro.img;
                    }
                }
                ring = 0;
            }  
            if (icon) streamDeck.setIcon(context,src,background,ring,ringColor);
            else streamDeck.setIcon(context, "", background,ring,ringColor);
            if (displayName == 0) name = ""; 
            streamDeck.setTitle(name,context);
        }
        else { //Macro Hotbar
            let macroId 
            if (mode == 'hotbar') macroId = game.user.data.hotbar[macroNumber];
            else {
                let macros;
                if (mode == 'customHotbar' && game.modules.get('custom-hotbar') != undefined) { 
                    macros = ui.customHotbar.macros;
                }
                else macros = game.macros.apps[0].macros;
                if (macroNumber > 9) macroNumber = 0;
                for (let j=0; j<10; j++){
                    if (macros[j].key == macroNumber){
                        if (macros[j].macro == null) macroId == undefined;
                        else macroId = macros[j].macro._id; 
                    }
                }
            }
            let src = "";
            let name = "";

            if (macroId != undefined){
                let macro = game.macros._source.find(p => p._id == macroId);
                if (macro != undefined) {
                    name += macro.name;
                    src += macro.img;
                }
            }
            if (icon) streamDeck.setIcon(context,src,background);
            else streamDeck.setIcon(context, "", background);
            if (displayName == 0) name = ""; 
            streamDeck.setTitle(name,context);
        }
        
    }

    hotbar(macros){
        for (let i=0; i<32; i++){  
            let data = streamDeck.buttonContext[i];
            if (data == undefined || data.action != 'macro' || data.settings.macroMode == 'macroBoard') continue;
            let context = data.context;
            let mode = data.settings.macroMode;
            let displayName = data.settings.displayName;
            let macroNumber = data.settings.macroNumber;
            let background = data.settings.background;
            let src = "";
            let name = "";
            if(macroNumber == undefined || isNaN(parseInt(macroNumber))){
                macroNumber = 1;
            }
            if (mode == undefined) mode = 'hotbar';
            if (mode == 'Macro Board') continue;
            if (displayName == undefined) displayName = false;
            if (background == undefined) background = '#000000';
            
            let macroId;
            if (mode == 'hotbar'){
                macroId = game.user.data.hotbar[macroNumber];
            }
            else {
                if (macroNumber > 9) macroNumber = 0;
                for (let j=0; j<10; j++){
                    if (macros[j].key == macroNumber){
                        if (macros[j].macro == null) macroId == undefined;
                        else macroId = macros[j].macro._id;
                    }  
                }
            }
            let macro = undefined;
            if (macroId != undefined) macro = game.macros._source.find(p => p._id == macroId);
            if (macro != undefined && macro != null) {
                name += macro.name;
                src += macro.img;
            }
            streamDeck.setIcon(context,src,background);
            if (displayName == 0) name = ""; 
            streamDeck.setTitle(name,context);
        }
    }
   
    keyPress(settings){
        let mode = settings.macroMode;
        if (mode == undefined) mode = 'hotbar';

        let macroNumber = settings.macroNumber;
        if(macroNumber == undefined || isNaN(parseInt(macroNumber))){
            macroNumber = 0;
        }

        if (mode == 'hotbar' || mode == 'visibleHotbar' || mode == 'customHotbar')
            this.executeHotbar(macroNumber,mode);
        else {
            if (settings.macroBoardMode == 'offset') {
                let macroOffset = settings.macroOffset;
                if (macroOffset == undefined) macroOffset = 0;
                this.offset = macroOffset;
                this.updateAll();
            }
            else 
                this.executeBoard(macroNumber);
        }
    }

    executeHotbar(macroNumber,mode){
        let macroId 
        if (mode == 'hotbar') macroId = game.user.data.hotbar[macroNumber];
        else {
            let macros;
            if (mode == 'customHotbar' && game.modules.get('custom-hotbar') != undefined) { 
                macros = ui.customHotbar.macros;
            }
            else macros = game.macros.apps[0].macros;
            if (macroNumber > 9) macroNumber = 0;
            for (let j=0; j<10; j++){
                if (macros[j].key == macroNumber){
                    if (macros[j].macro == null) macroId == undefined;
                    else macroId = macros[j].macro._id; 
                }
            }
        }
        if (macroId == undefined) return;
        let macro = game.macros.get(macroId);
        macro.execute();
    }

    executeBoard(macroNumber){
        macroNumber = parseInt(macroNumber);
        macroNumber += this.offset - 1;
        if (macroNumber < 0) macroNumber = 0;
        var macroId = game.settings.get(MODULE.moduleName,'macroSettings').macros[macroNumber];

        if (macroId != undefined){
            let macro = game.macros.get(macroId);
            if (macro != undefined && macro != null) {
                const args = game.settings.get(MODULE.moduleName,'macroSettings').args;
                let furnaceEnabled = false;
                let furnace = game.modules.get("furnace");
                if (furnace != undefined && furnace.active) furnaceEnabled = true;
                if (args == undefined || args[macroNumber] == undefined || args[macroNumber] == "") furnaceEnabled = false;
                if (furnaceEnabled == false) macro.execute();
                else {
                    let chatData = {
                        user: game.user._id,
                        speaker: ChatMessage.getSpeaker(),
                        content: "/'" + macro.name + "' " + args
                    };
                    ChatMessage.create(chatData, {});
                }
            }
        }
    }
}










