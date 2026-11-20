// Web Audio API Synthesizer für Santa-Blanca TCG
// High-Fidelity synthetisierte TCG-Soundeffekte: 100% offline & ohne externe Dateien.

class SoundManager {
  constructor() {
    this.ctx = null;
    this.muted = localStorage.getItem('sb_tcg_muted') === 'true';
  }

  init() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  isMuted() {
    return this.muted;
  }

  toggleMute() {
    this.muted = !this.muted;
    localStorage.setItem('sb_tcg_muted', this.muted);
    return this.muted;
  }

  // 1. Authentischer Booster-Foil Aufreißsound (Knisternde Folie + plastisches Zerreißen + Druck-Pop)
  playPackTear() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate;
    const duration = 0.55;

    // A) Knisterndes Folien-Rauschen mit unregelmäßigem Textur-Jitter
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = this.ctx.createBuffer(1, bufferSize, sampleRate);
    const data = buffer.getChannelData(0);

    for (let i = 0; i < bufferSize; i++) {
      // Mikro-Spikes simulieren das Abreißen einzelner Fasern der Folie
      const microCrackle = Math.random() > 0.88 ? (Math.random() * 2 - 1) * 1.5 : (Math.random() * 0.4 - 0.2);
      data[i] = microCrackle;
    }

    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = buffer;

    // Resonanter Bandpass-Filter sweep (Zzzzz-RRRIP)
    const bandpass = this.ctx.createBiquadFilter();
    bandpass.type = 'bandpass';
    bandpass.frequency.setValueAtTime(1100, t);
    bandpass.frequency.exponentialRampToValueAtTime(4800, t + 0.35);
    bandpass.frequency.exponentialRampToValueAtTime(1800, t + duration);
    bandpass.Q.setValueAtTime(4.2, t);

    // Highpass für knisternde Folienbrillanz
    const highpass = this.ctx.createBiquadFilter();
    highpass.type = 'highpass';
    highpass.frequency.setValueAtTime(1500, t);

    // Dynamische Lautstärke
    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, t);
    gain.gain.linearRampToValueAtTime(0.42, t + 0.06);
    gain.gain.linearRampToValueAtTime(0.35, t + 0.25);
    gain.gain.exponentialRampToValueAtTime(0.001, t + duration);

    noiseSource.connect(bandpass);
    bandpass.connect(highpass);
    highpass.connect(gain);
    gain.connect(this.ctx.destination);

    noiseSource.start(t);
    noiseSource.stop(t + duration);

    // B) Subtiler Vakuum-Pop beim Brechen des Luftverschlusses
    const popOsc = this.ctx.createOscillator();
    const popGain = this.ctx.createGain();
    popOsc.type = 'sine';
    popOsc.frequency.setValueAtTime(160, t);
    popOsc.frequency.exponentialRampToValueAtTime(55, t + 0.18);

    popGain.gain.setValueAtTime(0.38, t);
    popGain.gain.exponentialRampToValueAtTime(0.001, t + 0.18);

    popOsc.connect(popGain);
    popGain.connect(this.ctx.destination);
    popOsc.start(t);
    popOsc.stop(t + 0.18);
  }

  // 2. Taktiler Karten-Umdreh-Sound (Realistischer "Thwip / Card Snap" wie bei einer echten TCG-Karte)
  playCardFlip() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const sampleRate = this.ctx.sampleRate;

    // A) Sanfter Luftzug beim Wenden (Swoosh)
    const swooshLen = Math.floor(sampleRate * 0.14);
    const swooshBuf = this.ctx.createBuffer(1, swooshLen, sampleRate);
    const swooshData = swooshBuf.getChannelData(0);
    for (let i = 0; i < swooshLen; i++) {
      swooshData[i] = (Math.random() * 2 - 1) * (1 - i / swooshLen);
    }

    const swoosh = this.ctx.createBufferSource();
    swoosh.buffer = swooshBuf;

    const swooshFilter = this.ctx.createBiquadFilter();
    swooshFilter.type = 'bandpass';
    swooshFilter.frequency.setValueAtTime(800, t);
    swooshFilter.frequency.exponentialRampToValueAtTime(1600, t + 0.08);
    swooshFilter.Q.setValueAtTime(2.5, t);

    const swooshGain = this.ctx.createGain();
    swooshGain.gain.setValueAtTime(0.01, t);
    swooshGain.gain.linearRampToValueAtTime(0.25, t + 0.04);
    swooshGain.gain.exponentialRampToValueAtTime(0.001, t + 0.14);

    swoosh.connect(swooshFilter);
    swooshFilter.connect(swooshGain);
    swooshGain.connect(this.ctx.destination);
    swoosh.start(t);

    // B) Knackiger Karton-Snap (Das "Klack / Snap" wenn die Karte umklappt)
    const snapT = t + 0.04;
    const snapOsc = this.ctx.createOscillator();
    const snapGain = this.ctx.createGain();

    snapOsc.type = 'triangle';
    snapOsc.frequency.setValueAtTime(1850, snapT);
    snapOsc.frequency.exponentialRampToValueAtTime(320, snapT + 0.045);

    snapGain.gain.setValueAtTime(0.4, snapT);
    snapGain.gain.exponentialRampToValueAtTime(0.001, snapT + 0.045);

    snapOsc.connect(snapGain);
    snapGain.connect(this.ctx.destination);
    snapOsc.start(snapT);
    snapOsc.stop(snapT + 0.05);

    // Zweiter Mikro-Klick für plastische Haptik
    const snapOsc2 = this.ctx.createOscillator();
    const snapGain2 = this.ctx.createGain();
    snapOsc2.type = 'sine';
    snapOsc2.frequency.setValueAtTime(750, snapT + 0.015);
    snapOsc2.frequency.exponentialRampToValueAtTime(180, snapT + 0.055);

    snapGain2.gain.setValueAtTime(0.25, snapT + 0.015);
    snapGain2.gain.exponentialRampToValueAtTime(0.001, snapT + 0.055);

    snapOsc2.connect(snapGain2);
    snapGain2.connect(this.ctx.destination);
    snapOsc2.start(snapT + 0.015);
    snapOsc2.stop(snapT + 0.06);
  }

  // 3. Enthüllungs-Sounds nach Seltenheit
  playRevealSound(rarity = 'common') {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;

    if (rarity === 'legendary') {
      // Epische Triumphal-Fanfare & funkelnder Schimmer
      const notes = [440, 554.37, 659.25, 880, 1108.73, 1318.51];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = idx % 2 === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.055);

        gain.gain.setValueAtTime(0, t + idx * 0.055);
        gain.gain.linearRampToValueAtTime(0.28, t + idx * 0.055 + 0.025);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.055 + 0.85);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.055);
        osc.stop(t + idx * 0.055 + 0.85);
      });
    } else if (rarity === 'epic') {
      // Mystischer violetter Dreiklang
      const notes = [392, 493.88, 587.33, 783.99];
      notes.forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.07);

        gain.gain.setValueAtTime(0, t + idx * 0.07);
        gain.gain.linearRampToValueAtTime(0.22, t + idx * 0.07 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.07 + 0.65);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.07);
        osc.stop(t + idx * 0.07 + 0.65);
      });
    } else if (rarity === 'rare') {
      // Kristallines Doppel-Chime
      [523.25, 659.25, 783.99].forEach((freq, idx) => {
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, t + idx * 0.065);

        gain.gain.setValueAtTime(0, t + idx * 0.065);
        gain.gain.linearRampToValueAtTime(0.18, t + idx * 0.065 + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.001, t + idx * 0.065 + 0.45);

        osc.connect(gain);
        gain.connect(this.ctx.destination);
        osc.start(t + idx * 0.065);
        osc.stop(t + idx * 0.065 + 0.45);
      });
    } else {
      // Common / Uncommon: Sanfter harmonischer Bestätigungston
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(rarity === 'uncommon' ? 440 : 330, t);
      osc.frequency.exponentialRampToValueAtTime(rarity === 'uncommon' ? 554 : 392, t + 0.1);

      gain.gain.setValueAtTime(0.01, t);
      gain.gain.linearRampToValueAtTime(0.14, t + 0.02);
      gain.gain.exponentialRampToValueAtTime(0.001, t + 0.25);

      osc.connect(gain);
      gain.connect(this.ctx.destination);
      osc.start(t);
      osc.stop(t + 0.25);
    }
  }

  // 4. Haptischer Klick
  playClick() {
    if (this.muted) return;
    this.init();
    if (!this.ctx) return;

    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sine';
    osc.frequency.setValueAtTime(600, t);
    osc.frequency.exponentialRampToValueAtTime(300, t + 0.04);
    gain.gain.setValueAtTime(0.12, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.04);
    osc.connect(gain);
    gain.connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + 0.04);
  }
}

export const sound = new SoundManager();
