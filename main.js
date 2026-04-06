class Metronome {
    constructor(bpm = 120, beatsPerMeasure = 4, volume = 0.5) {
        this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        this.bpm = localStorage.getItem('metronomeBPM') || bpm;
        this.beatsPerMeasure = localStorage.getItem('metronomeBeatsPerMeasure') || beatsPerMeasure;
        this.volume = localStorage.getItem('metronomeVolume') || volume;
        this.isPlaying = false;
        this.currentBeatInMeasure = 0;
        this.nextNoteTime = 0.0;
        this.timerID = null;
        this.bpmRange = document.getElementById('bpm-range');
        this.bpmText = document.getElementById('bpm-text');
        this.volumeRange = document.getElementById('volume-range');
        this.volumeText = document.getElementById('volume-text');
        this.beatsText = document.getElementById('beats-text');
        this.playBtn = document.getElementById('play-btn');
    }
    
    initialize() {
        this.bpmRange.value = this.bpm;
        this.bpmText.value = this.bpm;
        this.volumeRange.value = this.volume * 100;
        this.volumeText.value = this.volume * 100;
        this.beatsText.value = this.beatsPerMeasure;
        this.playBtn.classList.remove('playing');
    }

    saveSettings() {
        localStorage.setItem('metronomeBPM', this.bpm);
        localStorage.setItem('metronomeBeatsPerMeasure', this.beatsPerMeasure);
        localStorage.setItem('metronomeVolume', this.volume);
    }
}

document.addEventListener('DOMContentLoaded', () => {
    const metronome = new Metronome();
    metronome.initialize();

    window.addEventListener('unload', () => {
        metronome.saveSettings();
    });

    metronome.bpmRange.addEventListener('input', (e) => {
        metronome.bpmText.value = e.target.value;
        metronome.bpm = e.target.value;
    });
    metronome.bpmText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 120;
        val = Math.max(30, Math.min(300, val));
        e.target.value = val;
        metronome.bpmRange.value = val;
        metronome.bpm = val;
    });

    metronome.volumeRange.addEventListener('input', (e) => {
        metronome.volumeText.value = e.target.value;
        metronome.volume = e.target.value / 100;
    });

    metronome.volumeText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val)) val = 50;
        val = Math.max(0, Math.min(100, val));
        e.target.value = val;
        metronome.volumeRange.value = val;
        metronome.volume = val / 100;
    });

    metronome.beatsText.addEventListener('change', (e) => {
        let val = parseInt(e.target.value, 10);
        if (isNaN(val) || val < 1) val = 4;
        e.target.value = val;
        metronome.beatsPerMeasure = val;
    });

    function nextNote() {
        const secondsPerBeat = 60.0 * 4 / metronome.bpm / metronome.beatsPerMeasure;
        metronome.nextNoteTime += secondsPerBeat;

        metronome.currentBeatInMeasure++;
        if (metronome.currentBeatInMeasure >= metronome.beatsPerMeasure) {
            metronome.currentBeatInMeasure = 0;
        }
    }

    function playClick(time) {
        const osc = metronome.audioContext.createOscillator();
        const gainNode = metronome.audioContext.createGain();

        if (metronome.currentBeatInMeasure === 0) {
            osc.frequency.value = 1200;
        } else {
            osc.frequency.value = 800;
        }

        gainNode.gain.setValueAtTime(metronome.volume, time);

        gainNode.gain.exponentialRampToValueAtTime(0.001, time + 0.05);

        osc.connect(gainNode);
        gainNode.connect(metronome.audioContext.destination);

        osc.start(time);
        osc.stop(time + 0.05);
    }

    function scheduler() {
        const scheduleAheadTime = 0.1;
        while (metronome.nextNoteTime < metronome.audioContext.currentTime + scheduleAheadTime) {
            playClick(metronome.nextNoteTime);
            nextNote();
        }
        metronome.timerID = setTimeout(scheduler, 25.0);
    }

    metronome.playBtn.addEventListener('click', () => {
        if (metronome.isPlaying) {
            clearTimeout(metronome.timerID);
            metronome.isPlaying = false;
            metronome.playBtn.textContent = '再生';
            metronome.playBtn.classList.remove('playing');
        } else {
            if (metronome.audioContext.state === 'suspended') {
                metronome.audioContext.resume();
            }
            metronome.currentBeatInMeasure = 0;
            metronome.nextNoteTime = metronome.audioContext.currentTime + 0.05;
            scheduler();

            metronome.isPlaying = true;
            metronome.playBtn.textContent = '停止';
            metronome.playBtn.classList.add('playing');
        }
    });
});