// Based on Midi Utils Library
// https://github.com/sole/MIDIUtils/blob/master/src/MIDIUtils.js

var MIDIUtils = {

	noteMap: {},
	noteNumberMap: [],
	notes: [ "C", "C#", "D", "D#", "E", "F", "F#", "G", "G#", "A", "A#", "B" ],

	init: function(){

		for (var i = 0; i < 127; i++) {

			var index = i,
			key = this.notes[index % 12],
		    octave = ((index / 12) | 0) - 1; // MIDI scale starts at octave = -1

		    if(key.length === 1) {
		    	key = key;
		    }

		    key += octave;

		    this.noteMap[key] = i;
		    this.noteNumberMap[i] = key;
		}
	},

	getBaseLog: function(value, base) {
		return Math.log(value) / Math.log(base);
	},

	frequencyFromNoteNumber: function(note) {
		return 440 * Math.pow(2,(note-57)/12);
	},

	noteNumberToName: function(note) {

		return this.noteNumberMap[note];
	},

	frequencyToNoteNumber: function(f) {
		return Math.round(12.0 * this.getBaseLog(f / 440.0, 2) + 69);
	}

};

MIDIUtils.init();