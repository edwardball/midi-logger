	// Thanks to Chris Wilson for the code to get the midi signals
	/* Copyright 2013 Chris Wilson

	   Licensed under the Apache License, Version 2.0 (the "License");
	   you may not use this file except in compliance with the License.
	   You may obtain a copy of the License at

	       http://www.apache.org/licenses/LICENSE-2.0

	   Unless required by applicable law or agreed to in writing, software
	   distributed under the License is distributed on an "AS IS" BASIS,
	   WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
	   See the License for the specific language governing permissions and
	   limitations under the License.
	*/


var MidiLogger = function(){

	this.maxRows = 100;
	this.rowCounter = 0;
	this.context = null; // the Web Audio "context" object
	this.midiAccess = null;	// the MIDIAccess object.
	var _this = this;

	this.init = function() {

		// patch up prefixes
		window.AudioContext = window.AudioContext||window.webkitAudioContext;

		this.context = new AudioContext();
		if (navigator.requestMIDIAccess){
			navigator.requestMIDIAccess().then(
				_this.onMIDIInit,
				_this.onMIDIReject
			);
		} else {
			$("#badtime").style("visibility", "visible");
		}

		$(".js-column-toggle").change(function(e){
			$(".js-midi-log-table").toggleClass($(this).data("class-to-toggle"));
		});

		$("#row-count-switcher").change(function(){
			this.maxRows = $(this).val();
			this.rowCounter = $(".js-midi-log-table tr").length - 1;

			$(".js-midi-log-table tr").filter(":gt("+$(this).val()+")").remove();
		});

	}

	this.hookUpMIDIInput = function() {
		var haveAtLeastOneDevice = false;
	    var inputs = _this.midiAccess.inputs.values();
	    for (var input = inputs.next(); input && !input.done; input = inputs.next()) {
	    	input.value.onmidimessage = _this.onMIDIMessage;
	    	haveAtLeastOneDevice = true;
	    }
	    var badtime = document.getElementById("badtime");

	    if (badtime){
	    	badtime.style.visibility = haveAtLeastOneDevice ? "hidden" : "visible";
	    }
	}

	this.onMIDIInit = function(midi) {
		_this.midiAccess = midi;
		_this.hookUpMIDIInput();
		_this.midiAccess.onstatechange = _this.hookUpMIDIInput;
	}

	this.onMIDIReject = function(err) {
		alert("The MIDI system failed to start.  You're gonna have a bad time :(");
	}

	this.onMIDIMessage = function( event ) {
	  _this.createTableRowMarkup(event);
	}

	this.startLoggingMIDIInput = function( midiAccess, indexOfPort ) {

	  _this.midiAccess.inputs.forEach( function(entry) {
	  	entry.onmidimessage = _this.onMIDIMessage;
	  });
	} 


	this.createTableRowMarkup = function(event){
		var arrTableMarkup = new Array();
		arrTableMarkup.push (     "<tr>" );
		arrTableMarkup.push (   	"<td class='time-column'>" );
		arrTableMarkup.push (   		event.timeStamp );
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='channel-column'>" );
		arrTableMarkup.push (   		this.printNumberinBase(((event.data[0] % 16)), $("#channel-message-format").val(), 15).toUpperCase()  ); // channel
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='channel-message-column'>" );
		arrTableMarkup.push (   		this.printNumberinBase((event.data[0]), $("#channel-message-format").val(), 255).toUpperCase() );
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='channel-message-desc-column'>" );
		arrTableMarkup.push (   		this.calculateChannelMessageType(event.data[0]) );
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='data-byte-1-column'>" );
		if ($("#show-note-name").prop('checked')){
			arrTableMarkup.push (   		this.midiNumberToNoteName(event.data[1]) );
		} else {
			arrTableMarkup.push (   		this.printNumberinBase((event.data[1]), $("#data-byte-format").val(), 127).toUpperCase() );
		}
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='data-byte-2-column'>" );
		if (typeof event.data[2] !== "undefined"){
			arrTableMarkup.push (   		this.printNumberinBase((event.data[2]), $("#data-byte-format").val(), 127).toUpperCase() );
		}
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='manufacturer-column'>" );
		arrTableMarkup.push (   		event.currentTarget.manufacturer );
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"<td class='model-column'>" );
		arrTableMarkup.push (   		event.currentTarget.name );
		arrTableMarkup.push (   	"</td>" );
		arrTableMarkup.push (   	"</tr>" );

		if (this.rowCounter < this.maxRows){
			this.rowCounter++;
		} else {
			$('.js-midi-log-table tr:last').remove();
		}
		$(".js-table-head-row").after(arrTableMarkup.join('') );
	}

	this.calculateChannelMessageType = function(number){
		// http://www.earlevel.com/main/1996/08/14/midi-overview/
		switch (Math.floor(number/16)) {
			case 8:
				return "Note off";
			case 9:
				return "Note on";
			case 10:
				return "Polyphonic key pressure";
			case 11:
				return "Mode change";
			case 12:
				return "Program change";
			case 13:
				return "Monophonic key pressure";
			case 14:
				return "Pitch bend";
		}
	}



	this.printNumberinBase = function(decimalNumber, base, maxValue){
		if (base == "dec"){
			var maxLength = (maxValue + "").length;
			var paddedOutput = this.pad(decimalNumber, maxLength)
			return paddedOutput;
		} else if (base == "bin"){
			var maxLength = maxValue.toString(2).length;
			var paddedOutput = this.pad(decimalNumber.toString(2), maxLength)
			return paddedOutput;
		} else if (base == "hex"){
			var maxLength = maxValue.toString(16).length;
			var paddedOutput = this.pad(decimalNumber.toString(16), maxLength)
			return paddedOutput;
		}
	}

	this.midiNumberToNoteName = function(midiNumber){
		return MIDIUtils.noteNumberToName(midiNumber);

	}
	
	this.pad = function(num, size) {
	    var s = num+"";
	    while (s.length < size) s = "0" + s;
	    return s;
	}
}
