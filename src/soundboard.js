import * as MODULE from "../MaterialDeck.js";
import {streamDeck} from "../MaterialDeck.js";

export class SoundboardControl{
    constructor(){
        this.active = false;
        this.offset = 0;
        this.activeSounds = [];
        for (let i=0; i<64; i++)
            this.activeSounds[i] = false;
    }

    async updateAll(){
        if (this.active == false) return;
        for (let i=0; i<32; i++){   
            let data = streamDeck.buttonContext[i];
            if (data == undefined || data.action != 'soundboard') continue;
            await this.update(data.settings,data.context);
        }
    }

    update(settings,context){
        this.active = true;
        let mode = settings.soundboardMode;
        if (mode == undefined) mode = 'playSound';

        let txt = "";
        let src = "";
        
        let background = settings.background;
        if (background == undefined) background = '#000000';

        let ringColor = "#000000"

        if (mode == 'playSound'){ //play sound
            let soundNr = parseInt(settings.soundNr);
            if (isNaN(soundNr)) soundNr = 1;
            soundNr--;
            soundNr += this.offset;

            let soundboardSettings = game.settings.get(MODULE.moduleName, 'soundboardSettings');
            
            if (this.activeSounds[soundNr]==false)
                ringColor = soundboardSettings.colorOff[soundNr];
            else 
                ringColor = soundboardSettings.colorOn[soundNr];

            if (settings.displayName && soundboardSettings.name != undefined) txt = soundboardSettings.name[soundNr];
            if (settings.displayIcon && soundboardSettings.img != undefined) src = soundboardSettings.img[soundNr];
            streamDeck.setTitle(txt,context);
            streamDeck.setIcon(context,src,background,2,ringColor);
        }
        else if (mode == 'offset') { //Offset
            let ringOffColor = settings.offRing;
            if (ringOffColor == undefined) ringOffColor = '#000000';

            let ringOnColor = settings.onRing;
            if (ringOnColor == undefined) ringOnColor = '#00FF00';

            let offset = parseInt(settings.offset);
            if (isNaN(offset)) offset = 0;
            if (offset == this.offset) ringColor = ringOnColor;
            else ringColor = ringOffColor;
            streamDeck.setTitle(txt,context);
            streamDeck.setIcon(context,"",background,2,ringColor);
        }
        else if (mode == 'stopAll') {   //Stop all sounds
            let src = 'modules/MaterialDeck/img/playlist/stop.png';
            let soundPlaying = false;
            for (let i=0; i<this.activeSounds.length; i++)
                if (this.activeSounds[i]) soundPlaying = true;
            if (soundPlaying)
                streamDeck.setIcon(context,src,settings.background,2,'#00FF00',true);
            else
                streamDeck.setIcon(context,src,settings.background,1,'#000000',true);
        }
    }

    keyPressDown(settings){
        let mode = settings.soundboardMode;
        if (mode == undefined) mode = 'playSound';
        if (mode == 'playSound') {    //Play sound
            let soundNr = parseInt(settings.soundNr);
            if (isNaN(soundNr)) soundNr = 1;
            soundNr--;
            soundNr += this.offset;

            const playMode = game.settings.get(MODULE.moduleName,'soundboardSettings').mode[soundNr];

            let repeat = false;
            if (playMode > 0) repeat = true;
            let play = false;
            if (this.activeSounds[soundNr] == false) play = true;
            this.playSound(soundNr,repeat,play);
        }
        else if (mode == 'offset') { //Offset
            let offset = parseInt(settings.offset);
            if (isNaN(offset)) offset = 0;
            this.offset = offset;
            this.updateAll();
        }
        else if (mode == 'stopAll') {  //Stop All Sounds
            for (let i=0; i<64; i++) {
                if (this.activeSounds[i] != false){
                    this.playSound(i,false,false);
                }
            }
        }
    }

    keyPressUp(settings){
        let mode = settings.soundboardMode;
        if (mode == undefined) mode = 'playSound';
        if (mode != 'playSound') return;
        let soundNr = parseInt(settings.soundNr);
        if (isNaN(soundNr)) soundNr = 1;
        soundNr--;
        soundNr += this.offset;

        const playMode = game.settings.get(MODULE.moduleName,'soundboardSettings').mode[soundNr];
        
        if (playMode == 2)
            this.playSound(soundNr,false,false);
    }

    async playSound(soundNr,repeat,play){  
        const soundBoardSettings = game.settings.get(MODULE.moduleName,'soundboardSettings');
        let playlistId;
        if (soundBoardSettings.selectedPlaylists != undefined) playlistId = soundBoardSettings.selectedPlaylists[soundNr];
        let src;
        if (playlistId == "" || playlistId == undefined) return;
        if (playlistId == 'none') return;
        else if (playlistId == 'FP') {
            src = soundBoardSettings.src[soundNr];
            const ret = await FilePicker.browse("data", src, {wildcard:true});
            const files = ret.files;
            if (files.length == 1) src = files;
            else {
                let value = Math.floor(Math.random() * Math.floor(files.length));
                src = files[value];
            }
        }
        else {
            const soundId = soundBoardSettings.sounds[soundNr];
            const sounds = game.playlists.entities.find(p => p._id == playlistId).data.sounds;
            if (sounds == undefined) return;
            const sound = sounds.find(p => p._id == soundId);
            if (sound == undefined) return;
            src = sound.path;
        }

        let volume = game.settings.get(MODULE.moduleName,'soundboardSettings').volume[soundNr]/100;
        volume = AudioHelper.inputToVolume(volume);
        
        let payload = {
            "msgType": "playSound", 
            "trackNr": soundNr,
            "src": src,
            "repeat": repeat,
            "play": play,
            "volume": volume
        };
        game.socket.emit(`module.MaterialDeck`, payload);

        if (play){
            volume *= game.settings.get("core", "globalInterfaceVolume");

            let howl = new Howl({src, volume, loop: repeat, onend: (id)=>{
                if (repeat == false){
                    this.activeSounds[soundNr] = false;
                    this.updateAll();
                }
            },
            onstop: (id)=>{
                this.activeSounds[soundNr] = false;
                this.updateAll();
            }});
            howl.play();
            this.activeSounds[soundNr] = howl;
        }
        else {
            this.activeSounds[soundNr].stop();
            this.activeSounds[soundNr] = false;
        }
        this.updateAll();
    }
}