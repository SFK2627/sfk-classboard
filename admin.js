const ADMIN_API_URL = "https://script.google.com/macros/s/AKfycbzCjWVnO-ZNvKTNqKN1zVscNsfPox0uDnO1QTSbBCrMFaS79tfL3mopHa2pH7gHczYeOA/exec";

let currentAdminSheet = "";
let editingRecord = null;
let latestAdminTableData = null;
let selectedAdminRows = new Set();
let activeAdminTool = null;
let currentAdminFilteredRows = [];

const TEACHER_OPTIONS = [
  "Mr. John Rey Tubello",
  "Ms. Chiarah De Castro",
  "Mrs. Melanie Sebastian",
  "Ms. Hannah Lee Cillo",
  "Ms Christine Tolentino",
  "Ms. Kamille Lajom",
  "Mr. Alexis Pastrana",
  "Ms. Gina Soriano",
  "Mr. Runmar Quipanes"
];

const TEXT_FORMAT_OPTIONS = ["center", "left", "right", "bullets", "numbers"];
const MAX_ANNOUNCEMENT_ATTACHMENTS = 5;
const MAX_ANNOUNCEMENT_ATTACHMENT_BYTES = 12 * 1024 * 1024;
const TARGET_ANNOUNCEMENT_IMAGE_BYTES = 360 * 1024;
const LOADING_SOUND_STORAGE_KEY = "sfkClassBoardIntroSoundChoice";
const LOADING_SOUND_DEFAULT_ID = "soft-chime";
const LOADING_SOUND_OPTIONS = [
  { id: "soft-chime", icon: "✨", name: "Soft Chime", desc: "Clean soft chime welcome", pad: [[261.63,0,9.65,"sine",0.14],[329.63,.08,9.45,"triangle",0.09],[392,.16,9.25,"sine",0.08]], notes: [[523.25,0,1.25,"triangle",0.50],[659.25,.18,1.45,"sine",0.48],[783.99,.42,1.60,"triangle",0.40],[1046.5,.78,1.70,"sine",0.25],[587.33,2.05,1.55,"triangle",0.34],[739.99,2.38,1.70,"sine",0.30],[987.77,2.85,1.95,"triangle",0.21],[523.25,4.30,1.65,"triangle",0.29],[698.46,4.72,1.85,"sine",0.24],[880,5.18,2.0,"triangle",0.19],[659.25,6.62,1.80,"sine",0.23],[783.99,7.05,1.90,"triangle",0.18],[1046.5,7.62,2.10,"sine",0.14]] },
  { id: "school-bell", icon: "🔔", name: "School Bell", desc: "Classic classroom bell tone", pad: [[196,0,9.6,"triangle",0.08],[392,.1,9.4,"sine",0.07]], notes: [[784,0,.9,"sine",0.54],[784,.72,.9,"sine",0.50],[987.77,1.55,1.05,"triangle",0.36],[784,2.6,.9,"sine",0.46],[784,3.28,.9,"sine",0.42],[1046.5,4.35,1.15,"triangle",0.30],[659.25,6.15,1.2,"sine",0.28],[880,7.0,1.5,"triangle",0.22]] },
  { id: "sparkle-intro", icon: "🌟", name: "Sparkle Intro", desc: "Bright magical sparkle", pad: [[293.66,0,9.7,"sine",0.10],[440,.12,9.45,"triangle",0.08]], notes: [[880,0,.75,"triangle",0.38],[1174.66,.14,.82,"sine",0.32],[1567.98,.34,.95,"triangle",0.25],[1318.51,1.20,.9,"sine",0.25],[987.77,1.65,1.15,"triangle",0.30],[1174.66,2.55,1.0,"sine",0.28],[1760,3.10,1.25,"triangle",0.16],[880,5.2,1.25,"triangle",0.25],[1318.51,6.05,1.35,"sine",0.22],[1567.98,7.1,1.6,"triangle",0.16]] },
  { id: "calm-welcome", icon: "🌤️", name: "Calm Welcome", desc: "Relaxed warm opening", pad: [[220,0,9.75,"sine",0.16],[277.18,.08,9.55,"sine",0.10],[329.63,.18,9.35,"triangle",0.07]], notes: [[440,.25,1.8,"sine",0.24],[554.37,1.3,2.1,"triangle",0.22],[659.25,2.9,2.0,"sine",0.18],[493.88,5.15,1.9,"triangle",0.21],[587.33,6.25,2.2,"sine",0.17],[739.99,7.6,2.0,"triangle",0.13]] },
  { id: "timer-pulse", icon: "⏱️", name: "Timer Pulse", desc: "Timer/game pulse sound", pad: [[246.94,0,9.5,"square",0.035],[493.88,.06,9.35,"sine",0.055]], notes: [[493.88,0,.42,"square",0.23],[493.88,.55,.42,"square",0.20],[493.88,1.10,.42,"square",0.20],[659.25,1.75,.52,"triangle",0.24],[493.88,2.45,.42,"square",0.20],[493.88,3.0,.42,"square",0.20],[739.99,3.70,.62,"triangle",0.22],[493.88,4.8,.42,"square",0.18],[493.88,5.35,.42,"square",0.18],[880,6.1,.72,"triangle",0.18],[659.25,7.35,1.4,"sine",0.16]] },
  { id: "cute-pop", icon: "💛", name: "Cute Pop", desc: "Cute and friendly pops", pad: [[329.63,0,9.5,"triangle",0.08],[493.88,.08,9.3,"sine",0.06]], notes: [[659.25,0,.6,"triangle",0.32],[783.99,.34,.65,"triangle",0.30],[987.77,.72,.8,"sine",0.24],[523.25,1.75,.55,"triangle",0.30],[659.25,2.07,.65,"triangle",0.28],[880,2.48,.75,"sine",0.22],[587.33,4.25,.65,"triangle",0.24],[739.99,4.68,.75,"sine",0.22],[987.77,5.18,.9,"triangle",0.18],[783.99,6.88,1.2,"sine",0.16]] },
  { id: "clean-startup", icon: "🚀", name: "Clean Startup", desc: "Modern startup intro", pad: [[174.61,0,9.7,"sine",0.13],[349.23,.1,9.45,"triangle",0.07]], notes: [[349.23,0,1.25,"sine",0.28],[440,.35,1.35,"triangle",0.25],[523.25,.78,1.5,"sine",0.22],[698.46,1.4,1.6,"triangle",0.18],[440,3.2,1.35,"sine",0.21],[554.37,3.75,1.5,"triangle",0.18],[659.25,4.45,1.7,"sine",0.15],[880,6.7,1.8,"triangle",0.12]] },
  { id: "happy-bell", icon: "😊", name: "Happy Bell", desc: "Happy classroom welcome", pad: [[261.63,0,9.65,"triangle",0.10],[523.25,.12,9.4,"sine",0.06]], notes: [[523.25,0,.95,"triangle",0.40],[659.25,.25,1.05,"sine",0.36],[783.99,.55,1.12,"triangle",0.30],[1046.5,1.05,1.25,"sine",0.20],[783.99,2.45,1.0,"triangle",0.28],[987.77,2.82,1.1,"sine",0.22],[1174.66,3.25,1.25,"triangle",0.18],[659.25,5.55,1.2,"sine",0.22],[880,6.2,1.35,"triangle",0.18],[1046.5,7.05,1.6,"sine",0.14]] },
  { id: "digital-ding", icon: "💻", name: "Digital Ding", desc: "Digital app sound", pad: [[220,0,9.55,"sine",0.07],[440,.08,9.35,"square",0.025]], notes: [[880,0,.45,"sine",0.36],[1320,.18,.35,"triangle",0.20],[660,.72,.45,"sine",0.32],[990,.9,.35,"triangle",0.18],[880,1.7,.45,"sine",0.30],[1320,1.88,.35,"triangle",0.16],[1108.73,3.3,.55,"sine",0.22],[1479.98,3.55,.42,"triangle",0.12],[880,5.6,.65,"sine",0.20],[1174.66,5.92,.5,"triangle",0.14],[1567.98,7.0,.95,"sine",0.10]] },
  { id: "warm-glow", icon: "🌅", name: "Warm Glow", desc: "Warm soft glow tone", pad: [[196,0,9.8,"sine",0.16],[246.94,.12,9.6,"triangle",0.11],[392,.25,9.25,"sine",0.07]], notes: [[392,.2,1.8,"sine",0.24],[493.88,1.25,2.0,"triangle",0.22],[587.33,2.55,2.2,"sine",0.18],[440,4.9,2.0,"triangle",0.18],[554.37,6.0,2.1,"sine",0.16],[783.99,7.35,1.9,"triangle",0.12]] },
  { id: "classroom-tone", icon: "🏫", name: "Classroom Tone", desc: "Simple class tone", pad: [[261.63,0,9.65,"sine",0.12],[392,.08,9.45,"triangle",0.08]], notes: [[659.25,0,1.0,"triangle",0.34],[523.25,.55,1.0,"sine",0.28],[659.25,1.25,1.1,"triangle",0.30],[783.99,2.05,1.15,"sine",0.24],[659.25,3.4,1.0,"triangle",0.26],[523.25,4.0,1.0,"sine",0.22],[880,5.15,1.3,"triangle",0.20],[783.99,6.55,1.4,"sine",0.16]] },
  { id: "magic-intro", icon: "🪄", name: "Magic Intro", desc: "Magic sparkle opening", pad: [[233.08,0,9.7,"sine",0.11],[349.23,.1,9.5,"triangle",0.075]], notes: [[932.33,0,.85,"triangle",0.30],[1244.51,.22,1.0,"sine",0.24],[1864.66,.58,1.15,"triangle",0.12],[698.46,1.55,1.05,"sine",0.24],[1046.5,2.05,1.2,"triangle",0.18],[1396.91,2.65,1.35,"sine",0.13],[830.61,4.65,1.2,"triangle",0.18],[1108.73,5.35,1.4,"sine",0.15],[1567.98,6.35,1.65,"triangle",0.10]] },
  { id: "focus-tone", icon: "🎯", name: "Focus Tone", desc: "Calm focus sound", pad: [[164.81,0,9.8,"sine",0.15],[246.94,.12,9.55,"sine",0.09],[329.63,.22,9.35,"triangle",0.06]], notes: [[329.63,.55,2.1,"sine",0.22],[493.88,1.7,2.2,"triangle",0.18],[659.25,3.15,2.0,"sine",0.14],[493.88,5.8,1.9,"triangle",0.15],[739.99,7.0,1.8,"sine",0.11]] },
  { id: "gentle-alert", icon: "🔔", name: "Gentle Alert", desc: "Soft alert tone", pad: [[246.94,0,9.65,"sine",0.12],[369.99,.1,9.45,"triangle",0.08]], notes: [[739.99,0,.85,"sine",0.30],[739.99,.62,.85,"sine",0.27],[587.33,1.6,1.15,"triangle",0.25],[739.99,2.45,.95,"sine",0.24],[880,3.4,1.05,"triangle",0.20],[587.33,5.55,1.2,"sine",0.18],[739.99,6.4,1.3,"triangle",0.15],[987.77,7.25,1.55,"sine",0.11]] },
  { id: "classic-bekind", icon: "🐨", name: "Classic BeKind", desc: "Classic SFK kindness sound", pad: [[261.63,0,9.7,"sine",0.14],[329.63,.08,9.5,"triangle",0.10],[392,.2,9.25,"sine",0.075]], notes: [[523.25,0,1.1,"triangle",0.42],[659.25,.32,1.2,"sine",0.36],[783.99,.72,1.35,"triangle",0.30],[659.25,2.1,1.15,"sine",0.28],[783.99,2.55,1.2,"triangle",0.24],[1046.5,3.1,1.5,"sine",0.17],[523.25,5.0,1.2,"triangle",0.24],[659.25,5.6,1.35,"sine",0.20],[783.99,6.35,1.5,"triangle",0.16],[1046.5,7.35,1.8,"sine",0.12]] },
  { id: "bass-boost", icon: "🔊", name: "Bass Boost", desc: "Deep bass intro with bold pulses", pad: [[65.41,0,9.85,"sine",0.20],[130.81,0.02,9.75,"sawtooth",0.055],[196,0.08,9.55,"triangle",0.055]], notes: [[130.81,0,.46,"sine",0.46],[130.81,.58,.46,"sine",0.42],[164.81,1.16,.5,"sine",0.44],[196,1.74,.58,"triangle",0.36],[130.81,2.55,.44,"sine",0.42],[130.81,3.05,.44,"sine",0.38],[220,3.62,.62,"sawtooth",0.25],[261.63,4.55,.72,"triangle",0.25],[130.81,5.55,.5,"sine",0.36],[196,6.18,.68,"sawtooth",0.22],[261.63,7.10,.9,"triangle",0.20],[329.63,8.05,1.2,"sine",0.17]] },
  { id: "energetic-beat", icon: "⚡", name: "Energetic Beat", desc: "Fast upbeat loading energy", pad: [[98,0,9.65,"sine",0.12],[196,.05,9.55,"square",0.035],[392,.1,9.45,"triangle",0.06]], notes: [[392,0,.25,"square",0.28],[523.25,.25,.25,"triangle",0.26],[659.25,.5,.25,"square",0.25],[783.99,.75,.38,"triangle",0.22],[392,1.25,.25,"square",0.28],[523.25,1.5,.25,"triangle",0.26],[659.25,1.75,.25,"square",0.25],[880,2.0,.45,"triangle",0.20],[493.88,3.0,.28,"square",0.26],[659.25,3.28,.28,"triangle",0.24],[783.99,3.56,.28,"square",0.22],[987.77,3.86,.48,"triangle",0.18],[523.25,5.2,.35,"square",0.24],[698.46,5.55,.35,"triangle",0.22],[880,5.9,.45,"square",0.18],[1046.5,6.4,.75,"triangle",0.16],[659.25,7.65,.5,"square",0.18],[987.77,8.15,.9,"triangle",0.13]] },
  { id: "power-start", icon: "🎮", name: "Power Start", desc: "Game-like power-on tone", pad: [[82.41,0,9.8,"sine",0.15],[164.81,.06,9.65,"sawtooth",0.05],[329.63,.12,9.5,"square",0.025]], notes: [[164.81,0,.38,"sine",0.38],[220,.42,.38,"sine",0.34],[293.66,.86,.45,"triangle",0.32],[392,1.36,.52,"sawtooth",0.25],[523.25,2.0,.62,"triangle",0.23],[659.25,2.72,.72,"square",0.16],[329.63,4.0,.48,"sine",0.28],[440,4.52,.5,"triangle",0.24],[587.33,5.08,.58,"sawtooth",0.20],[783.99,5.8,.72,"triangle",0.16],[987.77,7.1,1.1,"sine",0.12]] },
  { id: "party-pop", icon: "🎉", name: "Party Pop", desc: "Fun birthday-style pop intro", pad: [[174.61,0,9.6,"triangle",0.10],[349.23,.08,9.45,"sine",0.07]], notes: [[523.25,0,.32,"triangle",0.34],[659.25,.28,.36,"sine",0.32],[783.99,.6,.4,"triangle",0.30],[1046.5,1.0,.55,"sine",0.22],[659.25,1.8,.32,"triangle",0.30],[783.99,2.08,.36,"sine",0.28],[987.77,2.42,.46,"triangle",0.24],[1174.66,3.0,.62,"sine",0.18],[523.25,4.2,.34,"triangle",0.28],[698.46,4.52,.38,"sine",0.24],[880,4.9,.5,"triangle",0.20],[1318.51,5.55,.72,"sine",0.14],[783.99,7.2,.8,"triangle",0.18],[1046.5,8.0,1.1,"sine",0.12]] },
  { id: "deep-bell", icon: "🛎️", name: "Deep Bell", desc: "Deep bell with bass warmth", pad: [[73.42,0,9.85,"sine",0.18],[146.83,.08,9.65,"triangle",0.08],[293.66,.18,9.4,"sine",0.05]], notes: [[293.66,0,1.4,"triangle",0.32],[440,.3,1.5,"sine",0.24],[587.33,.72,1.65,"triangle",0.20],[293.66,2.8,1.2,"triangle",0.30],[493.88,3.1,1.35,"sine",0.22],[659.25,3.55,1.55,"triangle",0.16],[246.94,6.2,1.4,"triangle",0.28],[392,6.58,1.55,"sine",0.20],[523.25,7.1,1.8,"triangle",0.14]] }
,
  {"id":"arcade-coin-inspired","icon":"🕹️","name":"Arcade Coin Inspired","desc":"Familiar arcade coin-style sparkle","pad":[[196,0,9.6,"triangle",0.08],[392,0.06,9.4,"square",0.025]],"notes":[[987.77,0,0.18,"square",0.32],[1318.51,0.13,0.2,"square",0.28],[1760,0.28,0.3,"triangle",0.18],[987.77,1.15,0.18,"square",0.26],[1318.51,1.28,0.2,"square",0.24],[1975.53,1.48,0.34,"triangle",0.14],[1174.66,3.2,0.22,"square",0.22],[1567.98,3.36,0.28,"triangle",0.16],[1046.5,5.4,0.24,"square",0.2],[1396.91,5.6,0.3,"triangle",0.14],[1760,7.4,0.45,"sine",0.12]]},
  {"id":"retro-console-power","icon":"🎮","name":"Retro Console Power","desc":"Classic console power-up feeling","pad":[[82.41,0,9.8,"sine",0.16],[164.81,0.04,9.6,"sawtooth",0.05],[329.63,0.1,9.3,"square",0.025]],"notes":[[164.81,0,0.35,"sine",0.36],[220,0.4,0.35,"triangle",0.32],[293.66,0.8,0.42,"square",0.24],[392,1.28,0.5,"triangle",0.22],[523.25,1.9,0.65,"sawtooth",0.18],[659.25,2.62,0.75,"triangle",0.16],[783.99,3.5,0.9,"sine",0.13],[987.77,5.4,1.1,"triangle",0.11],[1318.51,7.2,1.4,"sine",0.08]]},
  {"id":"classic-pc-welcome","icon":"💻","name":"Classic PC Welcome","desc":"Old computer startup-inspired chime","pad":[[130.81,0,9.7,"sine",0.13],[261.63,0.1,9.5,"triangle",0.08],[523.25,0.2,9.25,"sine",0.045]],"notes":[[261.63,0,0.8,"sine",0.28],[329.63,0.35,0.95,"triangle",0.24],[392,0.78,1.1,"sine",0.22],[523.25,1.35,1.25,"triangle",0.18],[659.25,2.05,1.55,"sine",0.14],[523.25,4.5,1.3,"triangle",0.16],[783.99,5.35,1.5,"sine",0.12],[1046.5,6.5,1.8,"triangle",0.09]]},
  {"id":"phone-ping-classic","icon":"📱","name":"Phone Ping Classic","desc":"Clean phone notification style","pad":[[440,0,9.5,"sine",0.035]],"notes":[[880,0,0.18,"sine",0.34],[1174.66,0.16,0.22,"triangle",0.26],[880,0.55,0.18,"sine",0.28],[1318.51,0.72,0.25,"triangle",0.2],[1046.5,2.0,0.24,"sine",0.24],[1396.91,2.22,0.28,"triangle",0.16],[880,4.3,0.2,"sine",0.22],[1174.66,4.5,0.26,"triangle",0.16],[1567.98,6.8,0.38,"sine",0.1]]},
  {"id":"message-pop-stack","icon":"💬","name":"Message Pop Stack","desc":"Chat app pop notification vibe","pad":[[246.94,0,9.6,"triangle",0.07]],"notes":[[659.25,0,0.22,"triangle",0.3],[783.99,0.2,0.24,"triangle",0.28],[659.25,0.6,0.22,"triangle",0.26],[880,0.82,0.28,"sine",0.2],[523.25,1.7,0.2,"triangle",0.24],[659.25,1.9,0.24,"sine",0.2],[783.99,2.15,0.3,"triangle",0.18],[659.25,4.2,0.25,"triangle",0.2],[880,4.55,0.35,"sine",0.16],[1046.5,6.6,0.55,"triangle",0.1]]},
  {"id":"cinema-bass-boom","icon":"🎬","name":"Cinema Bass Boom","desc":"Big movie-logo bass entrance","pad":[[55,0,9.85,"sine",0.24],[110,0.02,9.7,"sine",0.13],[220,0.1,9.35,"sawtooth",0.035]],"notes":[[73.42,0,1.0,"sine",0.48],[98,0.35,1.1,"sine",0.42],[146.83,0.9,1.35,"triangle",0.34],[196,1.55,1.55,"sawtooth",0.22],[293.66,3.0,1.8,"triangle",0.18],[392,4.6,2.1,"sine",0.14],[587.33,6.4,2.3,"triangle",0.1]]},
  {"id":"deep-logo-hit","icon":"📣","name":"Deep Logo Hit","desc":"Short bold logo-hit intro","pad":[[65.41,0,9.8,"sine",0.22],[130.81,0.04,9.55,"triangle",0.08]],"notes":[[65.41,0,0.55,"sine",0.6],[98,0.5,0.65,"sine",0.48],[130.81,1.05,0.75,"triangle",0.4],[196,1.75,1.0,"sawtooth",0.24],[261.63,3.0,1.0,"triangle",0.22],[392,4.45,1.25,"sine",0.16],[523.25,6.3,1.55,"triangle",0.12]]},
  {"id":"victory-fanfare","icon":"🏆","name":"Victory Fanfare","desc":"Achievement and success sound","pad":[[196,0,9.65,"triangle",0.1],[392,0.08,9.4,"sine",0.08]],"notes":[[523.25,0,0.35,"triangle",0.32],[659.25,0.35,0.35,"triangle",0.3],[783.99,0.7,0.45,"sine",0.26],[1046.5,1.2,0.7,"triangle",0.2],[783.99,2.1,0.35,"triangle",0.26],[1046.5,2.45,0.45,"sine",0.2],[1318.51,3.0,0.8,"triangle",0.16],[1046.5,5.2,0.5,"triangle",0.18],[1567.98,5.8,0.9,"sine",0.12],[2093,7.0,1.2,"triangle",0.08]]},
  {"id":"level-up-8bit","icon":"⬆️","name":"Level Up 8-Bit","desc":"Retro level-up style melody","pad":[[98,0,9.5,"square",0.03],[196,0.05,9.35,"sine",0.06]],"notes":[[261.63,0,0.18,"square",0.26],[329.63,0.18,0.18,"square",0.25],[392,0.36,0.18,"square",0.24],[523.25,0.54,0.22,"square",0.22],[659.25,0.8,0.28,"square",0.2],[783.99,1.14,0.35,"square",0.17],[523.25,2.2,0.2,"square",0.23],[659.25,2.42,0.22,"square",0.21],[783.99,2.66,0.25,"square",0.19],[1046.5,3.0,0.4,"square",0.14],[1318.51,5.5,0.55,"square",0.1],[1567.98,6.35,0.75,"square",0.08]]},
  {"id":"achievement-unlock","icon":"🔓","name":"Achievement Unlock","desc":"Unlock badge / success vibe","pad":[[220,0,9.65,"sine",0.09],[440,0.08,9.45,"triangle",0.06]],"notes":[[659.25,0,0.32,"triangle",0.32],[987.77,0.25,0.42,"sine",0.24],[1318.51,0.65,0.55,"triangle",0.16],[783.99,1.85,0.35,"triangle",0.24],[1174.66,2.12,0.45,"sine",0.18],[1567.98,2.55,0.65,"triangle",0.12],[987.77,5.0,0.55,"sine",0.16],[1318.51,5.65,0.85,"triangle",0.1],[1760,7.1,1.05,"sine",0.08]]},
  {"id":"hero-rise","icon":"🦸","name":"Hero Rise","desc":"Brave energetic intro rise","pad":[[98,0,9.8,"sine",0.16],[196,0.1,9.55,"triangle",0.1],[392,0.2,9.3,"sawtooth",0.035]],"notes":[[196,0,0.8,"sine",0.3],[246.94,0.65,0.9,"triangle",0.28],[293.66,1.35,1.0,"sawtooth",0.22],[392,2.15,1.1,"triangle",0.2],[493.88,3.1,1.2,"sine",0.18],[587.33,4.1,1.35,"triangle",0.15],[783.99,5.45,1.5,"sawtooth",0.1],[987.77,6.9,1.8,"triangle",0.08]]},
  {"id":"news-sting","icon":"📰","name":"News Sting","desc":"Broadcast-style update sound","pad":[[130.81,0,9.55,"sine",0.12],[261.63,0.08,9.4,"triangle",0.08]],"notes":[[523.25,0,0.22,"square",0.26],[659.25,0.24,0.22,"triangle",0.24],[783.99,0.48,0.32,"square",0.2],[523.25,1.4,0.22,"square",0.24],[659.25,1.64,0.22,"triangle",0.22],[880,1.9,0.38,"square",0.16],[659.25,3.3,0.3,"triangle",0.2],[987.77,3.7,0.5,"sine",0.15],[783.99,5.7,0.45,"triangle",0.16],[1046.5,6.3,0.7,"sine",0.1]]},
  {"id":"sports-hype","icon":"📣","name":"Sports Hype","desc":"Arena hype and energizer tone","pad":[[73.42,0,9.8,"sine",0.18],[146.83,0.06,9.55,"sawtooth",0.06]],"notes":[[146.83,0,0.25,"sine",0.38],[146.83,0.35,0.25,"sine",0.34],[196,0.75,0.3,"triangle",0.32],[261.63,1.2,0.35,"sawtooth",0.24],[329.63,1.7,0.5,"triangle",0.22],[392,2.6,0.28,"sawtooth",0.22],[493.88,2.92,0.32,"triangle",0.2],[587.33,3.3,0.45,"sawtooth",0.16],[783.99,5.5,0.8,"triangle",0.13],[987.77,6.7,1.0,"sine",0.09]]},
  {"id":"neon-pulse","icon":"🌈","name":"Neon Pulse","desc":"Modern neon electronic pulse","pad":[[110,0,9.65,"sine",0.12],[220,0.05,9.5,"square",0.025],[440,0.12,9.35,"triangle",0.04]],"notes":[[440,0,0.25,"square",0.22],[554.37,0.28,0.25,"triangle",0.2],[659.25,0.56,0.28,"square",0.18],[880,0.9,0.35,"triangle",0.15],[440,2.0,0.25,"square",0.2],[659.25,2.32,0.3,"triangle",0.18],[987.77,2.72,0.42,"square",0.12],[554.37,4.6,0.3,"square",0.17],[739.99,5.0,0.4,"triangle",0.14],[1108.73,6.6,0.75,"sine",0.09]]},
  {"id":"sci-fi-scan","icon":"🛸","name":"Sci-Fi Scan","desc":"Futuristic scanner loading feel","pad":[[87.31,0,9.85,"sine",0.14],[174.61,0.05,9.6,"sawtooth",0.035]],"notes":[[220,0,0.4,"sawtooth",0.22],[277.18,0.42,0.4,"triangle",0.2],[349.23,0.85,0.5,"sawtooth",0.18],[440,1.4,0.55,"triangle",0.16],[554.37,2.05,0.65,"sawtooth",0.13],[698.46,2.85,0.8,"triangle",0.1],[440,4.9,0.55,"sawtooth",0.14],[659.25,5.6,0.8,"triangle",0.1],[880,6.8,1.1,"sine",0.08]]},
  {"id":"soft-piano-bell","icon":"🎹","name":"Soft Piano Bell","desc":"Gentle piano-bell inspired tones","pad":[[220,0,9.8,"sine",0.13],[329.63,0.12,9.55,"triangle",0.07]],"notes":[[440,0,1.1,"sine",0.24],[523.25,0.45,1.2,"triangle",0.22],[659.25,1.0,1.4,"sine",0.18],[783.99,1.75,1.55,"triangle",0.14],[523.25,4.2,1.2,"sine",0.18],[659.25,5.0,1.45,"triangle",0.14],[880,6.2,1.7,"sine",0.1]]},
  {"id":"grand-bell-hall","icon":"🔔","name":"Grand Bell Hall","desc":"Large bell hall resonance","pad":[[98,0,9.85,"sine",0.18],[196,0.1,9.65,"triangle",0.09]],"notes":[[196,0,1.5,"triangle",0.36],[293.66,0.22,1.7,"sine",0.28],[392,0.5,1.9,"triangle",0.22],[196,2.7,1.4,"triangle",0.32],[329.63,3.0,1.6,"sine",0.24],[493.88,3.45,1.8,"triangle",0.16],[261.63,6.1,1.6,"triangle",0.24],[392,6.5,1.9,"sine",0.18]]},
  {"id":"kalimba-kindness","icon":"🪕","name":"Kalimba Kindness","desc":"Cute wooden kalimba-style welcome","pad":[[261.63,0,9.65,"triangle",0.08],[523.25,0.1,9.35,"sine",0.04]],"notes":[[523.25,0,0.35,"triangle",0.3],[659.25,0.38,0.38,"triangle",0.28],[783.99,0.82,0.42,"triangle",0.24],[659.25,1.55,0.35,"triangle",0.24],[880,1.95,0.45,"sine",0.18],[523.25,3.6,0.38,"triangle",0.22],[659.25,4.05,0.42,"sine",0.18],[987.77,4.65,0.58,"triangle",0.13],[783.99,6.7,0.75,"sine",0.11]]},
  {"id":"xylophone-happy","icon":"🎵","name":"Xylophone Happy","desc":"Playful xylophone-style intro","pad":[[349.23,0,9.5,"triangle",0.07]],"notes":[[523.25,0,0.22,"triangle",0.31],[587.33,0.22,0.22,"triangle",0.3],[659.25,0.44,0.22,"triangle",0.28],[783.99,0.7,0.28,"triangle",0.24],[659.25,1.35,0.22,"triangle",0.26],[783.99,1.6,0.24,"triangle",0.22],[987.77,1.9,0.34,"sine",0.17],[587.33,3.7,0.25,"triangle",0.22],[739.99,4.0,0.35,"triangle",0.18],[880,5.8,0.55,"sine",0.12]]},
  {"id":"cartoon-spring","icon":"🌀","name":"Cartoon Spring","desc":"Funny springy cartoon pop","pad":[[196,0,9.5,"triangle",0.06]],"notes":[[392,0,0.16,"square",0.3],[523.25,0.14,0.18,"triangle",0.26],[659.25,0.32,0.22,"square",0.22],[523.25,0.7,0.18,"triangle",0.24],[783.99,0.92,0.32,"square",0.16],[440,2.0,0.18,"square",0.24],[587.33,2.2,0.22,"triangle",0.2],[880,2.52,0.36,"square",0.14],[659.25,4.5,0.3,"triangle",0.16],[987.77,5.1,0.5,"sine",0.1]]},
  {"id":"bubble-pop","icon":"🫧","name":"Bubble Pop","desc":"Light bubbly pop sequence","pad":[[329.63,0,9.45,"sine",0.05]],"notes":[[659.25,0,0.18,"sine",0.24],[783.99,0.2,0.2,"triangle",0.22],[987.77,0.45,0.24,"sine",0.18],[1174.66,0.78,0.32,"triangle",0.14],[783.99,1.7,0.2,"sine",0.2],[1046.5,2.0,0.32,"triangle",0.14],[659.25,3.8,0.22,"sine",0.18],[987.77,4.2,0.35,"triangle",0.12],[1318.51,6.3,0.55,"sine",0.08]]},
  {"id":"bass-drop-intro","icon":"💥","name":"Bass Drop Intro","desc":"Energetic bass drop-style startup","pad":[[55,0,9.85,"sine",0.24],[110,0.03,9.75,"sawtooth",0.055]],"notes":[[110,0,0.35,"sine",0.46],[98,0.42,0.42,"sine",0.42],[87.31,0.9,0.55,"sine",0.38],[73.42,1.55,0.75,"sine",0.34],[146.83,2.35,0.5,"sawtooth",0.26],[196,2.95,0.58,"triangle",0.22],[261.63,3.65,0.75,"sawtooth",0.18],[329.63,5.0,0.85,"triangle",0.14],[440,6.5,1.05,"sine",0.1]]},
  {"id":"electro-kick","icon":"🥁","name":"Electro Kick","desc":"Kick-pulse electronic intro","pad":[[65.41,0,9.85,"sine",0.18],[130.81,0.04,9.6,"square",0.025]],"notes":[[65.41,0,0.18,"sine",0.5],[261.63,0.18,0.22,"square",0.2],[65.41,0.55,0.18,"sine",0.46],[329.63,0.75,0.22,"square",0.18],[65.41,1.1,0.18,"sine",0.44],[392,1.32,0.28,"triangle",0.16],[65.41,2.2,0.18,"sine",0.42],[523.25,2.45,0.35,"square",0.12],[65.41,4.4,0.18,"sine",0.36],[659.25,4.8,0.55,"triangle",0.1],[880,6.8,0.75,"sine",0.08]]},
  {"id":"upbeat-clap","icon":"👏","name":"Upbeat Clap","desc":"Upbeat school-event energy","pad":[[98,0,9.6,"sine",0.13],[196,0.07,9.4,"triangle",0.06]],"notes":[[392,0,0.18,"square",0.28],[392,0.28,0.18,"square",0.26],[523.25,0.56,0.22,"triangle",0.23],[659.25,0.88,0.28,"sine",0.2],[392,1.6,0.18,"square",0.24],[392,1.88,0.18,"square",0.22],[587.33,2.2,0.25,"triangle",0.18],[783.99,2.58,0.38,"sine",0.14],[523.25,4.7,0.35,"triangle",0.16],[880,5.4,0.65,"sine",0.1]]},
  {"id":"tropical-pop","icon":"🌴","name":"Tropical Pop","desc":"Bright tropical pop welcome","pad":[[261.63,0,9.7,"triangle",0.09],[392,0.1,9.45,"sine",0.06]],"notes":[[523.25,0,0.32,"triangle",0.28],[659.25,0.35,0.35,"sine",0.25],[783.99,0.75,0.45,"triangle",0.2],[659.25,1.65,0.35,"sine",0.22],[880,2.05,0.48,"triangle",0.17],[1046.5,2.7,0.68,"sine",0.12],[587.33,4.8,0.42,"triangle",0.17],[783.99,5.35,0.62,"sine",0.12],[987.77,6.6,0.9,"triangle",0.09]]},
  {"id":"anime-spark","icon":"✨","name":"Anime Spark","desc":"Sparkly anime-style entrance","pad":[[293.66,0,9.7,"sine",0.09],[587.33,0.08,9.45,"triangle",0.045]],"notes":[[1046.5,0,0.28,"triangle",0.24],[1318.51,0.18,0.32,"sine",0.2],[1567.98,0.44,0.38,"triangle",0.16],[1975.53,0.82,0.55,"sine",0.1],[1174.66,2.05,0.36,"triangle",0.18],[1567.98,2.42,0.48,"sine",0.12],[2093,3.0,0.72,"triangle",0.08],[987.77,5.2,0.45,"triangle",0.14],[1318.51,5.8,0.7,"sine",0.09],[1760,7.0,1.0,"triangle",0.07]]},
  {"id":"luxury-chime","icon":"💎","name":"Luxury Chime","desc":"Premium elegant chime","pad":[[174.61,0,9.8,"sine",0.14],[349.23,0.12,9.55,"triangle",0.08],[523.25,0.22,9.25,"sine",0.045]],"notes":[[523.25,0,1.2,"sine",0.24],[659.25,0.55,1.35,"triangle",0.2],[783.99,1.2,1.55,"sine",0.16],[1046.5,2.0,1.8,"triangle",0.1],[659.25,4.5,1.35,"sine",0.16],[880,5.35,1.6,"triangle",0.11],[1174.66,6.55,2.0,"sine",0.08]]},
  {"id":"royal-welcome","icon":"👑","name":"Royal Welcome","desc":"Grand elegant entrance","pad":[[130.81,0,9.8,"sine",0.15],[261.63,0.08,9.55,"triangle",0.09],[392,0.2,9.3,"sine",0.06]],"notes":[[261.63,0,0.7,"triangle",0.3],[329.63,0.55,0.75,"sine",0.27],[392,1.1,0.85,"triangle",0.24],[523.25,1.8,1.0,"sine",0.2],[659.25,2.65,1.2,"triangle",0.16],[783.99,3.75,1.4,"sine",0.13],[1046.5,5.5,1.7,"triangle",0.09],[1318.51,7.0,1.8,"sine",0.07]]},
  {"id":"drumline-intro","icon":"🥁","name":"Drumline Intro","desc":"Marching drumline-inspired rhythm","pad":[[73.42,0,9.8,"sine",0.18],[146.83,0.04,9.55,"triangle",0.06]],"notes":[[146.83,0,0.14,"square",0.34],[146.83,0.22,0.14,"square",0.3],[146.83,0.44,0.14,"square",0.3],[196,0.72,0.2,"triangle",0.24],[146.83,1.1,0.14,"square",0.3],[146.83,1.32,0.14,"square",0.28],[246.94,1.65,0.26,"triangle",0.2],[146.83,2.3,0.14,"square",0.26],[293.66,2.7,0.38,"triangle",0.17],[392,4.3,0.55,"sawtooth",0.12],[523.25,6.4,0.8,"triangle",0.09]]},
  {"id":"cyber-start","icon":"🤖","name":"Cyber Start","desc":"Cyber tech startup scan","pad":[[65.41,0,9.8,"sine",0.13],[130.81,0.05,9.55,"sawtooth",0.035]],"notes":[[261.63,0,0.25,"sawtooth",0.2],[329.63,0.22,0.28,"square",0.18],[392,0.5,0.32,"sawtooth",0.16],[493.88,0.85,0.4,"triangle",0.14],[659.25,1.35,0.55,"square",0.1],[523.25,3.1,0.35,"sawtooth",0.14],[739.99,3.55,0.5,"triangle",0.1],[987.77,5.2,0.75,"square",0.07],[1318.51,6.7,1.0,"sine",0.06]]},
  {"id":"fantasy-spell","icon":"🪄","name":"Fantasy Spell","desc":"Magical spell-cast intro","pad":[[220,0,9.7,"sine",0.11],[440,0.12,9.5,"triangle",0.055]],"notes":[[880,0,0.35,"triangle",0.22],[1174.66,0.25,0.42,"sine",0.18],[1567.98,0.62,0.55,"triangle",0.12],[1975.53,1.2,0.7,"sine",0.08],[698.46,2.7,0.45,"triangle",0.16],[1046.5,3.22,0.65,"sine",0.11],[1396.91,4.0,0.85,"triangle",0.08],[987.77,5.7,0.65,"sine",0.1],[1760,7.0,1.2,"triangle",0.06]]},
  {"id":"gentle-heartbeat","icon":"💓","name":"Gentle Heartbeat","desc":"Soft love/kindness heartbeat","pad":[[98,0,9.85,"sine",0.16],[196,0.1,9.6,"triangle",0.06]],"notes":[[98,0,0.25,"sine",0.36],[98,0.42,0.2,"sine",0.3],[246.94,0.9,0.85,"triangle",0.17],[98,2.0,0.25,"sine",0.34],[98,2.42,0.2,"sine",0.28],[329.63,2.9,0.95,"triangle",0.15],[98,4.2,0.24,"sine",0.3],[98,4.62,0.2,"sine",0.24],[392,5.1,1.15,"sine",0.12],[523.25,6.6,1.4,"triangle",0.08]]},
  {"id":"angelic-choir","icon":"🪽","name":"Angelic Choir","desc":"Soft choir-like warm pad","pad":[[196,0,9.85,"sine",0.18],[246.94,0.12,9.65,"sine",0.13],[293.66,0.25,9.45,"triangle",0.08],[392,0.35,9.25,"sine",0.055]],"notes":[[392,0.7,1.8,"sine",0.16],[493.88,1.6,2.0,"triangle",0.13],[587.33,2.8,2.2,"sine",0.1],[523.25,5.0,2.0,"triangle",0.11],[659.25,6.4,2.1,"sine",0.08]]},
  {"id":"game-ready","icon":"🎯","name":"Game Ready","desc":"Ready-set-go game vibe","pad":[[98,0,9.6,"sine",0.14],[196,0.05,9.4,"square",0.03]],"notes":[[392,0,0.24,"square",0.28],[392,0.45,0.24,"square",0.26],[392,0.9,0.24,"square",0.24],[523.25,1.45,0.35,"triangle",0.22],[659.25,1.9,0.45,"square",0.18],[783.99,2.55,0.6,"triangle",0.15],[392,4.3,0.28,"square",0.2],[659.25,4.75,0.38,"triangle",0.16],[987.77,5.4,0.75,"sine",0.1]]},
  {"id":"soft-alarm","icon":"⏰","name":"Soft Alarm","desc":"Recognizable alarm-clock style","pad":[[220,0,9.65,"sine",0.09]],"notes":[[880,0,0.25,"sine",0.3],[880,0.38,0.25,"sine",0.28],[880,0.76,0.25,"sine",0.26],[659.25,1.35,0.4,"triangle",0.2],[880,2.2,0.25,"sine",0.26],[880,2.58,0.25,"sine",0.24],[1046.5,3.05,0.5,"triangle",0.16],[659.25,5.2,0.5,"sine",0.16],[880,6.0,0.7,"triangle",0.11]]},
  {"id":"train-chime","icon":"🚆","name":"Station Chime","desc":"Public station chime-inspired tone","pad":[[261.63,0,9.7,"triangle",0.09],[523.25,0.12,9.4,"sine",0.05]],"notes":[[659.25,0,0.55,"triangle",0.26],[783.99,0.45,0.65,"sine",0.22],[987.77,1.05,0.85,"triangle",0.16],[783.99,2.4,0.55,"sine",0.2],[659.25,2.95,0.65,"triangle",0.18],[880,3.65,0.9,"sine",0.13],[523.25,5.8,0.7,"triangle",0.16],[783.99,6.65,1.1,"sine",0.1]]},
  {"id":"doorbell-double","icon":"🚪","name":"Doorbell Double","desc":"Classic ding-dong style welcome","pad":[[196,0,9.7,"sine",0.1],[392,0.1,9.45,"triangle",0.06]],"notes":[[659.25,0,1.1,"sine",0.34],[523.25,0.72,1.25,"triangle",0.28],[659.25,2.6,1.0,"sine",0.3],[523.25,3.25,1.15,"triangle",0.24],[783.99,5.6,1.2,"sine",0.16],[659.25,6.35,1.4,"triangle",0.12]]},
  {"id":"school-dismissal","icon":"🏫","name":"School Dismissal","desc":"Friendly school bell pattern","pad":[[196,0,9.65,"triangle",0.09],[392,0.08,9.4,"sine",0.06]],"notes":[[784,0,0.65,"sine",0.44],[784,0.48,0.65,"sine",0.4],[784,0.96,0.65,"sine",0.36],[987.77,1.62,0.82,"triangle",0.26],[784,2.75,0.6,"sine",0.34],[784,3.2,0.6,"sine",0.3],[1046.5,3.9,0.9,"triangle",0.22],[659.25,6.0,1.0,"sine",0.18],[880,6.8,1.3,"triangle",0.13]]},
  {"id":"countdown-beep","icon":"⏳","name":"Countdown Beep","desc":"Countdown/timer beep sequence","pad":[[98,0,9.55,"sine",0.12]],"notes":[[880,0,0.18,"square",0.25],[880,0.8,0.18,"square",0.24],[880,1.6,0.18,"square",0.23],[1046.5,2.4,0.24,"square",0.22],[1046.5,3.2,0.24,"square",0.2],[1318.51,4.05,0.32,"triangle",0.14],[880,5.7,0.22,"square",0.18],[1174.66,6.3,0.38,"triangle",0.12]]},
  {"id":"riser-sweep","icon":"🌊","name":"Riser Sweep","desc":"Smooth rising sweep intro","pad":[[82.41,0,9.8,"sine",0.16],[164.81,0.1,9.55,"triangle",0.08]],"notes":[[220,0,1.0,"sawtooth",0.2],[277.18,0.85,1.05,"triangle",0.18],[349.23,1.75,1.1,"sawtooth",0.16],[440,2.7,1.2,"triangle",0.14],[554.37,3.8,1.35,"sawtooth",0.11],[698.46,5.0,1.5,"triangle",0.09],[880,6.4,1.7,"sine",0.07]]},
  {"id":"golden-spark","icon":"🌟","name":"Golden Spark","desc":"Bright gold sparkle sequence","pad":[[329.63,0,9.7,"sine",0.08],[659.25,0.08,9.45,"triangle",0.04]],"notes":[[1318.51,0,0.25,"triangle",0.18],[1760,0.2,0.32,"sine",0.12],[987.77,0.8,0.28,"triangle",0.18],[1318.51,1.05,0.38,"sine",0.12],[1567.98,1.45,0.5,"triangle",0.09],[1174.66,3.6,0.35,"triangle",0.13],[1567.98,4.0,0.55,"sine",0.08],[2093,5.8,0.8,"triangle",0.06]]},
  {"id":"kindness-bloom","icon":"🌷","name":"Kindness Bloom","desc":"Warm love/kindness bloom tone","pad":[[196,0,9.8,"sine",0.16],[246.94,0.14,9.6,"triangle",0.1],[329.63,0.25,9.35,"sine",0.065]],"notes":[[392,0.2,1.5,"sine",0.2],[493.88,1.1,1.65,"triangle",0.18],[587.33,2.15,1.8,"sine",0.14],[739.99,3.4,1.95,"triangle",0.1],[523.25,5.4,1.6,"sine",0.13],[659.25,6.35,1.8,"triangle",0.09],[880,7.4,1.75,"sine",0.06]]},
  {"id":"premium-stinger","icon":"⭐","name":"Premium Stinger","desc":"Clean premium app-logo stinger","pad":[[110,0,9.75,"sine",0.14],[220,0.08,9.55,"triangle",0.08]],"notes":[[220,0,0.45,"sine",0.32],[440,0.35,0.5,"triangle",0.24],[659.25,0.85,0.62,"sine",0.18],[880,1.45,0.85,"triangle",0.12],[1108.73,2.45,1.05,"sine",0.09],[554.37,4.8,0.75,"triangle",0.13],[880,5.7,1.1,"sine",0.08],[1318.51,7.0,1.4,"triangle",0.06]]},
  {"id":"warm-start-bass","icon":"🔈","name":"Warm Start Bass","desc":"Warm startup with soft bass","pad":[[65.41,0,9.85,"sine",0.2],[130.81,0.08,9.65,"triangle",0.09],[261.63,0.18,9.35,"sine",0.05]],"notes":[[130.81,0,0.8,"sine",0.36],[196,0.7,0.9,"triangle",0.28],[261.63,1.55,1.05,"sine",0.22],[329.63,2.55,1.2,"triangle",0.18],[392,4.2,1.25,"sine",0.15],[523.25,5.45,1.45,"triangle",0.11],[659.25,6.9,1.65,"sine",0.08]]}
];
let currentLoadingSoundId = LOADING_SOUND_DEFAULT_ID;
let adminLoadingSoundContext = null;


document.addEventListener("DOMContentLoaded", () => {
  initAdminToolLauncher();
  initRichTextEditors();
  renderHomepagePresetGallery();
  initLoadingSoundSettings();

  window.SFKAuth?.onAuthStateChanged((user, role) => {
    if (user && role === "admin") showAdminPanel();
    else showAdminLogin();
  });

  const pinInput = document.getElementById("adminPin");
  if (pinInput) {
    pinInput.addEventListener("keydown", (event) => {
      if (event.key === "Enter") {
        loginAdmin();
      }
    });
  }

  setTodayForDateInputs();
});

async function loginAdmin() {
  const pinInput = document.getElementById("adminPin");
  const message = document.getElementById("loginMessage");
  const pin = pinInput.value.trim();

  if (!pin) {
    message.textContent = "Enter the Admin PIN.";
    pinInput.focus();
    return;
  }

  message.textContent = "Checking access...";
  try {
    await window.SFKAuth.signInWithPin("admin", pin);
    pinInput.value = "";
    message.textContent = "";
  } catch (error) {
    message.textContent = "Incorrect PIN. Please try again.";
    pinInput.value = "";
    pinInput.focus();
  }
}

async function logoutAdmin() {
  closeAdminTool();
  await window.SFKAuth?.signOut();
  showAdminLogin();
}

function showAdminLogin() {
  document.getElementById("loginScreen").classList.remove("hidden");
  document.getElementById("adminPanel").classList.add("hidden");
}

function showAdminPanel() {
  document.getElementById("loginScreen").classList.add("hidden");
  document.getElementById("adminPanel").classList.remove("hidden");

  initAdminToolLauncher();
  initRichTextEditors();
  setTodayForDateInputs();
  loadHomepageDesignSettings();
  initLoadingSoundSettings();
  loadLoadingSoundSettings();
}

function initAdminToolLauncher() {
  const panel = document.getElementById("adminPanel");
  const grid = document.querySelector(".adminGrid");
  const managePanel = document.querySelector(".managePanel");
  if (!panel || !grid || panel.dataset.toolsReady === "true") return;

  panel.dataset.toolsReady = "true";
  panel.classList.add("toolsReady");

  const launcher = document.createElement("section");
  launcher.className = "toolLauncher";
  launcher.setAttribute("aria-label", "Admin tools");
  launcher.innerHTML = `
    <div class="toolLauncherHeader">
      <div>
        <p class="toolEyebrow">Choose action</p>
        <h2>What do you want to open?</h2>
      </div>
      <span>Forms are hidden until needed.</span>
    </div>
    <div class="toolLauncherGrid"></div>
  `;

  const launcherGrid = launcher.querySelector(".toolLauncherGrid");
  Array.from(grid.querySelectorAll(".formCard")).forEach((card, index) => {
    const title = card.querySelector("h2")?.textContent?.trim() || `Tool ${index + 1}`;
    const button = document.createElement("button");
    button.className = "toolLaunchButton";
    button.type = "button";
    button.innerHTML = `<strong>${escapeAdminText(title)}</strong><small>Create or publish this item</small>`;
    button.addEventListener("click", () => openAdminTool(card, title));
    launcherGrid.appendChild(button);
  });

  if (managePanel) {
    const button = document.createElement("button");
    button.className = "toolLaunchButton manageLaunchButton";
    button.type = "button";
    button.innerHTML = `<strong>🗂 Manage Existing Data</strong><small>View, edit, hide, or delete records</small>`;
    button.addEventListener("click", () => openAdminTool(managePanel, "Manage Existing Data"));
    launcherGrid.appendChild(button);
  }

  panel.insertBefore(launcher, grid);

  const modal = document.createElement("div");
  modal.id = "adminToolModal";
  modal.className = "toolModal hidden";
  modal.innerHTML = `
    <div class="toolModalBackdrop" data-admin-tool-close></div>
    <section class="toolModalCard" role="dialog" aria-modal="true" aria-labelledby="adminToolModalTitle">
      <header class="toolModalHeader">
        <div>
          <p class="toolEyebrow">SFK Admin</p>
          <h2 id="adminToolModalTitle">Tool</h2>
        </div>
        <button class="toolModalClose" type="button" data-admin-tool-close aria-label="Close">×</button>
      </header>
      <div id="adminToolModalContent" class="toolModalContent"></div>
    </section>
  `;
  document.body.appendChild(modal);
  modal.addEventListener("click", (event) => {
    if (event.target.closest("[data-admin-tool-close]")) closeAdminTool();
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && !modal.classList.contains("hidden")) closeAdminTool();
  });
}

function openAdminTool(element, title) {
  if (!element) return;
  closeAdminTool();

  const modal = document.getElementById("adminToolModal");
  const content = document.getElementById("adminToolModalContent");
  const titleElement = document.getElementById("adminToolModalTitle");
  if (!modal || !content || !titleElement) return;

  activeAdminTool = {
    element,
    parent: element.parentNode,
    nextSibling: element.nextSibling
  };

  titleElement.textContent = title.replace(/^[^\w]+/, "").trim() || title;
  content.appendChild(element);
  element.classList.add("toolModalPanel");
  modal.classList.toggle("toolModalManage", element.classList.contains("managePanel"));
  modal.classList.remove("hidden");
  document.body.classList.add("toolModalOpen");

  const firstInput = element.querySelector("input, textarea, select, button");
  window.setTimeout(() => firstInput?.focus({ preventScroll: true }), 80);
}

function closeAdminTool() {
  const modal = document.getElementById("adminToolModal");
  const content = document.getElementById("adminToolModalContent");

  if (activeAdminTool?.element && activeAdminTool.parent) {
    activeAdminTool.element.classList.remove("toolModalPanel");
    activeAdminTool.parent.insertBefore(activeAdminTool.element, activeAdminTool.nextSibling);
  }

  activeAdminTool = null;
  if (content) content.innerHTML = "";
  modal?.classList.add("hidden");
  modal?.classList.remove("toolModalManage");
  document.body.classList.remove("toolModalOpen");
}

function escapeAdminText(value) {
  return String(value || "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}

function setTodayForDateInputs() {
  const today = new Date().toLocaleDateString("en-CA", {
    timeZone: "Asia/Manila"
  });

  const dateInputs = [
    "announcementDeadline",
    "announcementPublishDate",
    "thingsDate",
    "adviserDate",
    "prayerDate",
    "quoteDateInput",
    "birthdayDate"
  ];

  dateInputs.forEach(id => {
    const input = document.getElementById(id);
    if (input && !input.value) {
      input.value = today;
    }
  });
}

async function sendAdminData(type, payload) {
  showToast("Saving...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type,
        payload
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      showToast("Saved successfully.");

      if (currentAdminSheet) {
        refreshCurrentAdminTable();
      }

      return true;
    }

    showToast(result.message || "Failed to save.");
    return false;

  } catch (error) {
    console.error(error);
    showToast("Error saving data.");
    return false;
  }
}

function showToast(message) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;

  toast.textContent = message;
  toast.classList.remove("hidden");

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 2500);
}

function showToastAction(message, actionLabel, callback) {
  const toast = document.getElementById("adminToast");
  if (!toast) return;

  toast.innerHTML = `<span>${escapeHtml(message)}</span><button type="button">${escapeHtml(actionLabel)}</button>`;
  toast.classList.remove("hidden");

  const button = toast.querySelector("button");
  button?.addEventListener("click", () => {
    toast.classList.add("hidden");
    callback?.();
  });

  clearTimeout(window.adminToastTimer);
  window.adminToastTimer = setTimeout(() => {
    toast.classList.add("hidden");
  }, 6500);
}

function clearFields(ids) {
  ids.forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;

    if (el.classList && el.classList.contains("richHiddenTextarea")) {
      clearRichEditorForTarget(id);
    } else if (el.tagName === "SELECT") {
      el.selectedIndex = 0;
    } else {
      el.value = "";
    }
  });

  setTodayForDateInputs();
}



/* Loading Sound Settings */
function isValidLoadingSoundId(id) {
  return LOADING_SOUND_OPTIONS.some(option => option.id === id);
}

function getLoadingSoundOption(id) {
  return LOADING_SOUND_OPTIONS.find(option => option.id === id) || LOADING_SOUND_OPTIONS[0];
}

function getLocalLoadingSoundId() {
  try {
    const saved = localStorage.getItem(LOADING_SOUND_STORAGE_KEY);
    if (isValidLoadingSoundId(saved)) return saved;
  } catch (error) {}
  return LOADING_SOUND_DEFAULT_ID;
}

function setLoadingSoundStatus(message) {
  const status = document.getElementById("loadingSoundStatus");
  if (status) status.textContent = message;
}

function initLoadingSoundSettings() {
  const list = document.getElementById("loadingSoundOptions");
  if (!list || list.dataset.rendered === "true") return;
  list.dataset.rendered = "true";
  currentLoadingSoundId = getLocalLoadingSoundId();

  list.innerHTML = LOADING_SOUND_OPTIONS.map((option, index) => `
    <article class="loadingSoundOption" data-sound-id="${escapeAdminText(option.id)}">
      <strong>${escapeAdminText(option.icon || "🔊")} ${index + 1}. ${escapeAdminText(option.name)}</strong>
      <small>${escapeAdminText(option.desc || "10-second loading sound")}</small>
      <div class="loadingSoundActions">
        <button type="button" class="loadingSoundPreview" data-preview-sound="${escapeAdminText(option.id)}">▶ Preview</button>
        <button type="button" class="loadingSoundUse" data-use-sound="${escapeAdminText(option.id)}">Use</button>
      </div>
    </article>
  `).join("");

  list.addEventListener("click", async (event) => {
    const preview = event.target.closest("[data-preview-sound]");
    const use = event.target.closest("[data-use-sound]");
    if (preview) {
      await playLoadingSoundPreview(preview.dataset.previewSound);
      return;
    }
    if (use) {
      await saveLoadingSoundChoice(use.dataset.useSound);
    }
  });

  updateLoadingSoundSelectionUi();
  setLoadingSoundStatus("Choose a loading sound. Preview first, then click Use.");
}

function updateLoadingSoundSelectionUi() {
  document.querySelectorAll(".loadingSoundOption").forEach(card => {
    const selected = card.dataset.soundId === currentLoadingSoundId;
    card.classList.toggle("is-selected", selected);
    const useButton = card.querySelector(".loadingSoundUse");
    if (useButton) useButton.textContent = selected ? "Selected" : "Use";
  });
}

async function loadLoadingSoundSettings() {
  currentLoadingSoundId = getLocalLoadingSoundId();
  updateLoadingSoundSelectionUi();

  try {
    const response = await fetch(`${ADMIN_API_URL}?type=settings`, { cache: "no-store" });
    const settings = await response.json();
    const selected = String(settings?.LoadingSoundId || "").trim();
    if (isValidLoadingSoundId(selected)) {
      currentLoadingSoundId = selected;
      try { localStorage.setItem(LOADING_SOUND_STORAGE_KEY, selected); } catch (error) {}
      updateLoadingSoundSelectionUi();
      setLoadingSoundStatus(`Selected loading sound: ${getLoadingSoundOption(selected).name}`);
    } else {
      setLoadingSoundStatus(`Selected loading sound: ${getLoadingSoundOption(currentLoadingSoundId).name}`);
    }
  } catch (error) {
    setLoadingSoundStatus(`Using this device selection: ${getLoadingSoundOption(currentLoadingSoundId).name}`);
  }
}

async function saveLoadingSoundChoice(id) {
  if (!isValidLoadingSoundId(id)) return;
  currentLoadingSoundId = id;
  try { localStorage.setItem(LOADING_SOUND_STORAGE_KEY, id); } catch (error) {}
  updateLoadingSoundSelectionUi();
  setLoadingSoundStatus("Saving loading sound...");

  const saved = await sendAdminData("loadingSoundSettings", { LoadingSoundId: id });
  if (saved) {
    setLoadingSoundStatus(`Saved. Loading screen will use: ${getLoadingSoundOption(id).name}`);
  } else {
    setLoadingSoundStatus(`Saved on this device only for now: ${getLoadingSoundOption(id).name}`);
  }
}

async function playLoadingSoundPreview(id) {
  const option = getLoadingSoundOption(id);
  setLoadingSoundStatus(`Previewing: ${option.name}`);

  try {
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) throw new Error("No AudioContext");
    const context = adminLoadingSoundContext || new AudioContextClass();
    adminLoadingSoundContext = context;
    if (context.state === "suspended") await context.resume();

    const now = context.currentTime + 0.015;
    const duration = 10.0;
    const master = context.createGain();
    const compressor = context.createDynamicsCompressor ? context.createDynamicsCompressor() : null;
    master.gain.setValueAtTime(0.0001, now);
    master.gain.exponentialRampToValueAtTime(0.62, now + 0.025);
    master.gain.exponentialRampToValueAtTime(0.36, now + 1.1);
    master.gain.setValueAtTime(0.36, now + 8.55);
    master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
    if (compressor) {
      compressor.threshold.setValueAtTime(-18, now);
      compressor.knee.setValueAtTime(24, now);
      compressor.ratio.setValueAtTime(4, now);
      compressor.attack.setValueAtTime(0.004, now);
      compressor.release.setValueAtTime(0.18, now);
      master.connect(compressor);
      compressor.connect(context.destination);
    } else {
      master.connect(context.destination);
    }

    const shimmerDelay = context.createDelay(1.2);
    const shimmerEcho = context.createGain();
    shimmerDelay.delayTime.setValueAtTime(0.32, now);
    shimmerEcho.gain.setValueAtTime(0.34, now);
    shimmerDelay.connect(shimmerEcho);
    shimmerEcho.connect(master);

    scheduleAdminLoadingSound(context, master, shimmerDelay, now, option);

    window.setTimeout(() => {
      try { shimmerDelay.disconnect(); } catch (error) {}
      try { shimmerEcho.disconnect(); } catch (error) {}
      try { master.disconnect(); } catch (error) {}
      try { if (compressor) compressor.disconnect(); } catch (error) {}
      setLoadingSoundStatus(`Preview finished: ${option.name}`);
    }, 10600);
  } catch (error) {
    setLoadingSoundStatus("Preview could not play. Try clicking again or check browser sound permission.");
  }
}

function scheduleAdminLoadingSound(context, master, shimmerDelay, now, option) {
  (option.pad || []).forEach(([frequency, offset, duration, type, volume]) => {
    playAdminLoadingTone(context, master, frequency, now + Number(offset || 0), duration || 1, type || "sine", volume || 0.08);
  });
  (option.notes || []).forEach(([frequency, offset, duration, type, volume]) => {
    const start = now + Number(offset || 0);
    playAdminLoadingTone(context, master, frequency, start, duration || 1, type || "triangle", volume || 0.22);
    playAdminLoadingTone(context, shimmerDelay, frequency * 1.005, start + 0.04, (duration || 1) * 0.82, type || "triangle", (volume || 0.22) * 0.32);
  });
}

function playAdminLoadingTone(context, destination, frequency, startTime, duration, type, volume) {
  const oscillator = context.createOscillator();
  const gain = context.createGain();
  oscillator.type = type;
  oscillator.frequency.setValueAtTime(frequency, startTime);
  oscillator.frequency.exponentialRampToValueAtTime(frequency * 1.006, startTime + Math.min(duration, 0.45));
  gain.gain.setValueAtTime(0.0001, startTime);
  gain.gain.exponentialRampToValueAtTime(Math.min(volume * 2.15, 1.0), startTime + 0.018);
  gain.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);
  oscillator.connect(gain);
  gain.connect(destination);
  oscillator.start(startTime);
  oscillator.stop(startTime + duration + 0.05);
}

/* RICH TEXT EDITOR FOR ANNOUNCEMENTS / THINGS TO BRING */
const RICH_TEXT_PREFIX = "[rich]";
const RICH_LIST_STYLES = ["disc", "circle", "square", "decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"];
const RICH_ALIGNMENTS = ["left", "center", "right"];
const RICH_INDENT_STEP_EM = 1.25;
const RICH_MAX_INDENT_LEVEL = 6;

function initRichTextEditors() {
  if (!window.__sfkRichSelectionWatcherAttached) {
    window.__sfkRichSelectionWatcherAttached = true;
    document.addEventListener("selectionchange", () => {
      const activeComposer = document.activeElement && document.activeElement.closest ? document.activeElement.closest(".richComposer") : null;
      if (activeComposer) saveRichSelection(activeComposer);
    });
  }

  document.querySelectorAll(".richComposer").forEach(composer => {
    if (composer.dataset.richReady === "true") return;
    const targetId = composer.dataset.richTarget;
    const editor = composer.querySelector(".richEditor");
    if (!targetId || !editor) return;

    composer.dataset.richReady = "true";

    editor.addEventListener("input", () => syncRichEditorToTextarea(targetId));
    editor.addEventListener("blur", () => {
      saveRichSelection(composer);
      syncRichEditorToTextarea(targetId);
    });
    editor.addEventListener("keyup", () => saveRichSelection(composer));
    editor.addEventListener("mouseup", () => saveRichSelection(composer));
    editor.addEventListener("touchend", () => setTimeout(() => saveRichSelection(composer), 0));
    editor.addEventListener("paste", (event) => handleRichEditorPaste(event, targetId));

    composer.querySelectorAll("[data-rich-command], [data-rich-list], [data-rich-align], [data-rich-indent], [data-rich-color]").forEach(button => {
      button.addEventListener("mousedown", event => event.preventDefault());
      button.addEventListener("click", () => runRichEditorToolbarAction(composer, button));
    });

    composer.querySelectorAll("[data-rich-color-picker]").forEach(input => {
      input.addEventListener("mousedown", () => saveRichSelection(composer));
      input.addEventListener("input", () => runRichEditorColorPickerAction(composer, input.value));
      input.addEventListener("change", () => runRichEditorColorPickerAction(composer, input.value));
    });

    syncRichEditorToTextarea(targetId);
  });
}

function getRichEditorToolbarMarkup(label = "Formatting tools") {
  return `
    <div class="richToolbar" aria-label="${escapeHtml(label)}">
      <div class="richToolbarGroup" aria-label="Text style">
        <button type="button" data-rich-command="bold" title="Bold selected text"><b>B</b></button>
        <button type="button" data-rich-command="italic" title="Italic selected text"><i>I</i></button>
        <button type="button" data-rich-command="underline" title="Underline selected text"><u>U</u></button>
      </div>
      <div class="richToolbarGroup" aria-label="Bullets and numbering">
        <button type="button" data-rich-list="disc" title="Bullet list">•</button>
        <button type="button" data-rich-list="circle" title="Circle bullet">○</button>
        <button type="button" data-rich-list="square" title="Square bullet">▪</button>
        <button type="button" data-rich-list="decimal" title="Numbered list">1.</button>
        <button type="button" data-rich-list="lower-alpha" title="Letter list">a.</button>
        <button type="button" data-rich-list="upper-alpha" title="Capital letter list">A.</button>
      </div>
      <div class="richToolbarGroup" aria-label="Indent">
        <button type="button" data-rich-indent="out" title="Decrease indent">⇤</button>
        <button type="button" data-rich-indent="in" title="Increase indent">⇥</button>
      </div>
      <div class="richToolbarGroup" aria-label="Text color">
        <button type="button" class="richColorChip richColorBlack" data-rich-color="#111111" title="Black text">A</button>
        <button type="button" class="richColorChip richColorRed" data-rich-color="#d62828" title="Red text">A</button>
        <button type="button" class="richColorChip richColorBlue" data-rich-color="#2563eb" title="Blue text">A</button>
        <button type="button" class="richColorChip richColorGreen" data-rich-color="#0f766e" title="Green text">A</button>
        <button type="button" class="richColorChip richColorPurple" data-rich-color="#7c3aed" title="Purple text">A</button>
        <label class="richColorPickerLabel" title="Custom text color"><span>Color</span><input type="color" data-rich-color-picker value="#111111" aria-label="Custom text color"></label>
      </div>
      <div class="richToolbarGroup" aria-label="Alignment">
        <button type="button" data-rich-align="left" title="Align left">Left</button>
        <button type="button" data-rich-align="center" title="Align center">Center</button>
        <button type="button" data-rich-align="right" title="Align right">Right</button>
        <button type="button" data-rich-command="removeFormat" title="Clear selected formatting">Clear</button>
      </div>
    </div>`;
}

function runRichEditorToolbarAction(composer, button) {
  const targetId = composer.dataset.richTarget;
  const editor = composer.querySelector(".richEditor");
  if (!editor) return;

  editor.focus();
  restoreRichSelection(composer);

  const command = button.dataset.richCommand;
  const listStyle = button.dataset.richList;
  const align = button.dataset.richAlign;
  const indent = button.dataset.richIndent;
  const color = button.dataset.richColor;

  if (command) {
    document.execCommand(command, false, null);
  }

  if (align && RICH_ALIGNMENTS.includes(align)) {
    const commandName = align === "center" ? "justifyCenter" : align === "right" ? "justifyRight" : "justifyLeft";
    document.execCommand(commandName, false, null);
    applyAlignmentToSelectedBlocks(editor, align);
  }

  if (listStyle && RICH_LIST_STYLES.includes(listStyle)) {
    applyListStyleToSelection(editor, listStyle);
  }

  if (indent === "in" || indent === "out") {
    applyRichIndentToSelection(editor, indent === "in" ? 1 : -1);
  }

  if (color) {
    applyRichTextColor(editor, color);
  }

  saveRichSelection(composer);
  syncRichEditorToTextarea(targetId);
}

function runRichEditorColorPickerAction(composer, color) {
  const targetId = composer.dataset.richTarget;
  const editor = composer.querySelector(".richEditor");
  if (!editor) return;

  editor.focus();
  restoreRichSelection(composer);
  applyRichTextColor(editor, color);
  saveRichSelection(composer);
  syncRichEditorToTextarea(targetId);
}

function saveRichSelection(composer) {
  const editor = composer.querySelector(".richEditor");
  const selection = window.getSelection && window.getSelection();
  if (!editor || !selection || !selection.rangeCount) return;

  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if ((anchor && editor.contains(anchor)) || (focus && editor.contains(focus))) {
    composer.__savedRichRange = selection.getRangeAt(0).cloneRange();
  }
}

function restoreRichSelection(composer) {
  const editor = composer.querySelector(".richEditor");
  const selection = window.getSelection && window.getSelection();
  const range = composer.__savedRichRange;
  if (!editor || !selection || !range) return;

  const startInside = range.startContainer === editor || editor.contains(range.startContainer);
  const endInside = range.endContainer === editor || editor.contains(range.endContainer);
  if (!startInside || !endInside) return;

  selection.removeAllRanges();
  selection.addRange(range);
}

function handleRichEditorPaste(event, targetId) {
  event.preventDefault();
  const text = (event.clipboardData || window.clipboardData)?.getData("text/plain") || "";
  document.execCommand("insertText", false, text);
  syncRichEditorToTextarea(targetId);
}

function applyListStyleToSelection(editor, listStyle) {
  const needsOrdered = ["decimal", "lower-alpha", "upper-alpha", "lower-roman", "upper-roman"].includes(listStyle);
  const desiredTag = needsOrdered ? "OL" : "UL";
  let list = getCurrentListElement(editor);

  if (!list || list.tagName !== desiredTag) {
    document.execCommand(needsOrdered ? "insertOrderedList" : "insertUnorderedList", false, null);
    list = getCurrentListElement(editor);
  }

  if (list && RICH_LIST_STYLES.includes(listStyle)) {
    list.style.listStyleType = listStyle;
  }
}

function getCurrentListElement(editor) {
  const selection = window.getSelection && window.getSelection();
  let node = selection && selection.rangeCount ? selection.anchorNode : null;

  if (!node || !editor.contains(node)) {
    node = editor;
  }

  if (node.nodeType === Node.TEXT_NODE) {
    node = node.parentElement;
  }

  while (node && node !== editor) {
    if (node.tagName === "UL" || node.tagName === "OL") return node;
    node = node.parentElement;
  }

  return editor.querySelector("ul, ol");
}

function applyAlignmentToSelectedBlocks(editor, align) {
  const blocks = getSelectedRichBlocks(editor);
  const listTargets = new Set();

  blocks.forEach(block => {
    const list = getClosestRichList(editor, block);
    if (list) {
      listTargets.add(list);
    } else {
      block.style.textAlign = align;
    }
  });

  listTargets.forEach(list => applyRichListAlignment(list, align));
}

function applyRichListAlignment(list, align) {
  list.style.textAlign = align;

  if (align === "left") {
    list.style.width = "100%";
    list.style.marginLeft = "0";
    list.style.marginRight = "0";
  } else if (align === "center") {
    list.style.width = "fit-content";
    list.style.marginLeft = "auto";
    list.style.marginRight = "auto";
  } else if (align === "right") {
    list.style.width = "100%";
    list.style.marginLeft = "0";
    list.style.marginRight = "0";
  }
}

function applyRichIndentToSelection(editor, direction) {
  const blocks = getSelectedRichBlocks(editor);
  if (!blocks.length) return;

  const targets = [];
  const seen = new Set();

  blocks.forEach(block => {
    const target = getRichIndentTarget(editor, block);
    if (target && !seen.has(target)) {
      seen.add(target);
      targets.push(target);
    }
  });

  targets.forEach(target => {
    const current = parseRichIndentValue(target.style.marginLeft);
    const next = Math.max(0, Math.min(RICH_MAX_INDENT_LEVEL * RICH_INDENT_STEP_EM, current + (direction * RICH_INDENT_STEP_EM)));

    if (next <= 0.01) {
      target.style.removeProperty("margin-left");
    } else {
      target.style.marginLeft = formatRichIndentValue(next);
    }
  });
}

function getRichIndentTarget(editor, block) {
  const list = getClosestRichList(editor, block);
  return list || block;
}

function getClosestRichList(editor, node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== editor) {
    if (node.tagName === "UL" || node.tagName === "OL") return node;
    node = node.parentElement;
  }

  return null;
}

function applyRichTextColor(editor, color) {
  const cleanColor = normalizeRichColor(color);
  if (!cleanColor) return;
  document.execCommand("foreColor", false, cleanColor);
}

function getSelectedRichBlocks(editor) {
  const selection = window.getSelection && window.getSelection();
  if (!selection || !selection.rangeCount) return [];

  const range = selection.getRangeAt(0);
  const anchor = selection.anchorNode;
  const focus = selection.focusNode;
  if ((!anchor || !editor.contains(anchor)) && (!focus || !editor.contains(focus))) return [];

  const candidates = Array.from(editor.querySelectorAll("p, div, li"))
    .filter(el => {
      try {
        return range.intersectsNode(el);
      } catch (error) {
        return false;
      }
    });

  const smallestBlocks = candidates.filter(el => !candidates.some(other => other !== el && el.contains(other)));
  if (smallestBlocks.length) return smallestBlocks;

  const closest = getClosestRichBlock(editor, anchor || focus);
  if (closest) return [closest];

  document.execCommand("formatBlock", false, "div");
  const created = getClosestRichBlock(editor, selection.anchorNode);
  return created ? [created] : [];
}

function getClosestRichBlock(editor, node) {
  if (!node) return null;
  if (node.nodeType === Node.TEXT_NODE) node = node.parentElement;

  while (node && node !== editor) {
    if (["P", "DIV", "LI"].includes(node.tagName)) return node;
    node = node.parentElement;
  }

  return null;
}

function parseRichIndentValue(value) {
  const raw = String(value || "").trim().toLowerCase();
  if (!raw) return 0;

  if (raw.endsWith("em")) return Number.parseFloat(raw) || 0;
  if (raw.endsWith("px")) return (Number.parseFloat(raw) || 0) / 16;
  return Number.parseFloat(raw) || 0;
}

function formatRichIndentValue(value) {
  const rounded = Math.round(value * 100) / 100;
  return `${String(rounded).replace(/\.00$/, "").replace(/(\.\d)0$/, "$1")}em`;
}

function normalizeRichColor(value) {
  const raw = String(value || "").trim().toLowerCase();

  const shortHex = raw.match(/^#([0-9a-f]{3})$/i);
  if (shortHex) {
    return `#${shortHex[1].split("").map(char => char + char).join("")}`.toLowerCase();
  }

  if (/^#[0-9a-f]{6}$/i.test(raw)) return raw.toLowerCase();

  const rgb = raw.match(/^rgba?\((\d{1,3}),\s*(\d{1,3}),\s*(\d{1,3})(?:,\s*(?:0|1|0?\.\d+))?\)$/i);
  if (rgb) {
    const parts = rgb.slice(1, 4).map(part => Math.max(0, Math.min(255, Number(part) || 0)));
    return `#${parts.map(part => part.toString(16).padStart(2, "0")).join("")}`;
  }

  return "";
}

function normalizeRichIndent(value) {
  const parsed = parseRichIndentValue(value);
  if (!Number.isFinite(parsed) || parsed <= 0) return "";
  const max = RICH_MAX_INDENT_LEVEL * RICH_INDENT_STEP_EM;
  return formatRichIndentValue(Math.min(max, parsed));
}

function syncRichEditorToTextarea(targetId) {
  const hidden = document.getElementById(targetId);
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  if (!hidden || !editor) return;

  const html = sanitizeRichEditorHtml(editor.innerHTML);
  const plainText = getRichEditorPlainText(targetId);
  hidden.value = plainText ? `${RICH_TEXT_PREFIX}\n${html}` : "";
}

function getRichEditorStorageValue(targetId) {
  syncRichEditorToTextarea(targetId);
  const hidden = document.getElementById(targetId);
  return hidden ? hidden.value.trim() : "";
}

function isRichTextStorageValue(value) {
  return /^\[rich\]\s*\n/i.test(String(value || "").replace(/\r/g, ""));
}

function getRichTextStorageHtml(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/^\[rich\]\s*\n?/i, "")
    .trim();
}

function getRichEditorPlainText(targetId) {
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  return editor ? String(editor.innerText || "").replace(/\u00a0/g, " ").trim() : "";
}

function clearRichEditorForTarget(targetId) {
  const hidden = document.getElementById(targetId);
  const editor = document.querySelector(`.richComposer[data-rich-target="${targetId}"] .richEditor`);
  if (hidden) hidden.value = "";
  if (editor) editor.innerHTML = "";
}

function sanitizeRichEditorHtml(html) {
  const template = document.createElement("template");
  template.innerHTML = String(html || "");
  const fragment = sanitizeRichNode(template.content);
  const wrapper = document.createElement("div");
  wrapper.appendChild(fragment);
  return wrapper.innerHTML
    .replace(/<div><br><\/div>/gi, "")
    .replace(/<p><br><\/p>/gi, "")
    .trim();
}

function sanitizeRichNode(node) {
  const fragment = document.createDocumentFragment();

  node.childNodes.forEach(child => {
    if (child.nodeType === Node.TEXT_NODE) {
      fragment.appendChild(document.createTextNode(child.textContent || ""));
      return;
    }

    if (child.nodeType !== Node.ELEMENT_NODE) return;

    const tag = child.tagName.toLowerCase();
    const allowed = ["b", "strong", "i", "em", "u", "br", "div", "p", "ul", "ol", "li", "span", "font"];

    if (!allowed.includes(tag)) {
      fragment.appendChild(sanitizeRichNode(child));
      return;
    }

    const cleanTag = tag === "font" ? "span" : tag;
    const clean = document.createElement(cleanTag);
    const styleParts = [];
    const textAlign = String(child.style?.textAlign || "").toLowerCase();
    const listStyleType = String(child.style?.listStyleType || "").toLowerCase();
    const fontWeight = String(child.style?.fontWeight || "").toLowerCase();
    const fontStyle = String(child.style?.fontStyle || "").toLowerCase();
    const textDecoration = String(child.style?.textDecoration || "").toLowerCase();
    const color = normalizeRichColor(child.getAttribute("color") || child.style?.color || "");
    const indent = normalizeRichIndent(child.style?.marginLeft || "");

    if (RICH_ALIGNMENTS.includes(textAlign)) styleParts.push(`text-align:${textAlign}`);
    if ((cleanTag === "ul" || cleanTag === "ol") && RICH_LIST_STYLES.includes(listStyleType)) {
      styleParts.push(`list-style-type:${listStyleType}`);
    }
    if (["div", "p", "li", "ul", "ol"].includes(cleanTag) && indent) styleParts.push(`margin-left:${indent}`);
    if (cleanTag === "span" && (fontWeight === "bold" || Number(fontWeight) >= 600)) styleParts.push("font-weight:700");
    if (cleanTag === "span" && fontStyle === "italic") styleParts.push("font-style:italic");
    if (cleanTag === "span" && textDecoration.includes("underline")) styleParts.push("text-decoration:underline");
    if (cleanTag === "span" && color) styleParts.push(`color:${color}`);
    if (styleParts.length) clean.setAttribute("style", styleParts.join(";"));

    clean.appendChild(sanitizeRichNode(child));
    fragment.appendChild(clean);
  });

  return fragment;
}

/* SUBJECT ANNOUNCEMENT */
async function saveAnnouncement() {
  const announcementText = getRichEditorStorageValue("announcementText");
  const attachmentFiles = await buildAttachmentPayload("announcementAttachments", showToast);

  if (attachmentFiles === null) return;

  const payload = {
    Date: document.getElementById("announcementPublishDate").value,
    Subject: document.getElementById("announcementSubject").value,
    Announcement: announcementText,
    Teacher: document.getElementById("announcementTeacher").value,
    Deadline: document.getElementById("announcementDeadline").value,
    PublishDate: document.getElementById("announcementPublishDate").value,
    ExpiryDate: document.getElementById("announcementExpiryDate").value,
    ShowDeadline: document.getElementById("announcementShowDeadline").value,
    AttachmentFiles: attachmentFiles,
    Priority: document.getElementById("announcementPriority").value,
    Publish: document.getElementById("announcementPublish").value
  };

  if (!payload.PublishDate || !payload.Subject || !payload.Announcement || !payload.Teacher) {
    showToast("Publish date, subject, teacher, and announcement are required.");
    return;
  }

  if (payload.PublishDate && payload.ExpiryDate && payload.ExpiryDate <= payload.PublishDate) {
    showToast("Expiry Date must be after the Publish Date.");
    return;
  }

  const saved = await sendAdminData("announcement", payload);

  if (saved) {
    clearFields([
      "announcementSubject",
      "announcementText",
      "announcementFormat",
      "announcementAttachments",
      "announcementTeacher",
      "announcementDeadline",
      "announcementPublishDate",
      "announcementExpiryDate",
      "announcementShowDeadline",
      "announcementPriority",
      "announcementPublish"
    ]);
  }
}

/* THINGS TO BRING */
async function saveThingsToBring() {
  const itemText = getRichEditorStorageValue("thingsItem");

  const payload = {
    Date: document.getElementById("thingsDate").value,
    Subject: document.getElementById("thingsSubject").value,
    Item: itemText,
    Publish: document.getElementById("thingsPublish").value
  };

  if (!payload.Date || !payload.Subject || !payload.Item) {
    showToast("Date needed, subject, and item are required.");
    return;
  }

  const saved = await sendAdminData("things", payload);

  if (saved) {
    clearFields([
      "thingsDate",
      "thingsSubject",
      "thingsItem",
      "thingsFormat",
      "thingsPublish"
    ]);
  }
}

/* ADVISER REMINDER */
async function saveAdviserReminder() {
  const reminderText = document.getElementById("adviserReminder").value.trim();
  const reminderFormat = document.getElementById("adviserFormat").value;

  const payload = {
    Date: document.getElementById("adviserDate").value,
    Reminder: applyTextFormat(reminderText, reminderFormat),
    Publish: document.getElementById("adviserPublish").value
  };

  if (!payload.Date || !payload.Reminder) {
    showToast("Date and reminder are required.");
    return;
  }

  const saved = await sendAdminData("reminder", payload);

  if (saved) {
    clearFields([
      "adviserDate",
      "adviserReminder",
      "adviserFormat",
      "adviserPublish"
    ]);
  }
}

/* PRAYER LEADER */
async function savePrayerLeader() {
  const payload = {
    Date: document.getElementById("prayerDate").value,
    PrayerLeader: document.getElementById("prayerName").value.trim(),
    Publish: document.getElementById("prayerPublish").value
  };

  if (!payload.Date || !payload.PrayerLeader) {
    showToast("Date and prayer leader are required.");
    return;
  }

  const saved = await sendAdminData("prayer", payload);

  if (saved) {
    clearFields([
      "prayerDate",
      "prayerName",
      "prayerPublish"
    ]);
  }
}

/* DAILY KINDNESS QUOTE */
async function saveQuote() {
  const payload = {
    Date: document.getElementById("quoteDateInput").value,
    Quote: document.getElementById("quoteTextInput").value.trim(),
    Author: document.getElementById("quoteAuthorInput").value.trim(),
    Publish: document.getElementById("quotePublishInput").value
  };

  if (!payload.Date || !payload.Quote) {
    showToast("Date and quote are required.");
    return;
  }

  const saved = await sendAdminData("quote", payload);

  if (saved) {
    clearFields([
      "quoteDateInput",
      "quoteTextInput",
      "quoteAuthorInput",
      "quotePublishInput"
    ]);
  }
}

/* BIRTHDAY */
async function saveBirthday() {
  const payload = {
    Name: document.getElementById("birthdayName").value.trim(),
    Birthday: document.getElementById("birthdayDate").value,
    Publish: document.getElementById("birthdayPublish").value
  };

  if (!payload.Name || !payload.Birthday) {
    showToast("Name and birthday are required.");
    return;
  }

  const saved = await sendAdminData("birthday", payload);

  if (saved) {
    clearFields([
      "birthdayName",
      "birthdayDate",
      "birthdayPublish"
    ]);
  }
}

/* TICKER MESSAGE */
async function saveTickerMessage() {
  const payload = {
    Message: document.getElementById("tickerMessage").value.trim(),
    Priority: "Normal",
    Publish: document.getElementById("tickerPublish").value
  };

  if (!payload.Message) {
    showToast("Ticker message is required.");
    return;
  }

  const saved = await sendAdminData("ticker", payload);

  if (saved) {
    clearFields([
      "tickerMessage",
      "tickerPublish"
    ]);
  }
}

async function buildAttachmentPayload(inputId, notify) {
  const input = document.getElementById(inputId);
  const files = input && input.files ? Array.from(input.files) : [];

  if (files.length === 0) return [];

  if (files.length > MAX_ANNOUNCEMENT_ATTACHMENTS) {
    notify(`Maximum of ${MAX_ANNOUNCEMENT_ATTACHMENTS} photos only.`);
    return null;
  }

  const unsupported = files.find(file => !String(file.type || "").startsWith("image/"));
  if (unsupported) {
    notify("No-billing mode supports image uploads only. Use a public link for PDFs/docs.");
    return null;
  }

  const totalBytes = files.reduce((sum, file) => sum + file.size, 0);

  if (totalBytes > MAX_ANNOUNCEMENT_ATTACHMENT_BYTES) {
    notify("Photos are too large. Keep selected photos under 12 MB before compression.");
    return null;
  }

  try {
    return await Promise.all(files.map(file => readAttachmentFile(file)));
  } catch (error) {
    notify(error.message || "Unable to prepare one of the photos.");
    return null;
  }
}

async function readAttachmentFile(file) {
  const imageUrl = await readAdminAttachmentDataUrl(file);
  const image = await loadAdminAttachmentImage(imageUrl);
  const blob = await compressAdminAttachmentImage(image);
  const dataUrl = await readAdminAttachmentDataUrl(blob || file);

  return {
    name: file.name.replace(/\.[^.]+$/, "") + ".jpg",
    mimeType: "image/jpeg",
    data: String(dataUrl || "").split(",")[1] || ""
  };
}

function readAdminAttachmentDataUrl(fileOrBlob) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result || ""));
    reader.onerror = () => reject(reader.error || new Error("Unable to read attachment."));
    reader.readAsDataURL(fileOrBlob);
  });
}

function loadAdminAttachmentImage(src) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Unable to prepare one of the photos."));
    image.src = src;
  });
}

async function compressAdminAttachmentImage(image) {
  const dimensions = [1280, 1100, 900, 760, 640];
  const qualities = [.74, .66, .58, .5, .42];
  let bestBlob = null;

  for (const maxDimension of dimensions) {
    const ratio = Math.min(1, maxDimension / Math.max(image.naturalWidth, image.naturalHeight));
    const width = Math.max(1, Math.round(image.naturalWidth * ratio));
    const height = Math.max(1, Math.round(image.naturalHeight * ratio));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    context.fillStyle = "#fff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);

    for (const quality of qualities) {
      const blob = await new Promise(resolve => canvas.toBlob(resolve, "image/jpeg", quality));
      if (!blob) continue;
      bestBlob = blob;
      if (blob.size <= TARGET_ANNOUNCEMENT_IMAGE_BYTES) return blob;
    }
  }

  return bestBlob;
}

/* CLASS SCHEDULE */
async function saveClassSchedule() {
  const payload = {
    Day: document.getElementById("scheduleDay").value,
    StartTime: normalizeScheduleTimeInput(document.getElementById("scheduleStartTime").value),
    EndTime: normalizeScheduleTimeInput(document.getElementById("scheduleEndTime").value),
    Subject: document.getElementById("scheduleSubject").value.trim(),
    Teacher: document.getElementById("scheduleTeacher").value.trim(),
    Room: document.getElementById("scheduleRoom").value.trim(),
    Color: normalizeScheduleColorInput(document.getElementById("scheduleColor").value),
    Publish: document.getElementById("schedulePublish").value
  };

  if (!payload.Day || !payload.StartTime || !payload.EndTime || !payload.Subject) {
    showToast("Day, start time, end time, and subject/block are required.");
    return;
  }

  if (scheduleTimeToMinutes(payload.EndTime) <= scheduleTimeToMinutes(payload.StartTime)) {
    showToast("End time must be after the start time.");
    return;
  }

  const saved = await sendAdminData("schedule", payload);

  if (saved) {
    clearFields([
      "scheduleStartTime",
      "scheduleEndTime",
      "scheduleSubject",
      "scheduleTeacher",
      "scheduleRoom",
      "scheduleColor",
      "schedulePublish"
    ]);
  }
}

function normalizeScheduleColorInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const hex = text.match(/^#?([0-9a-fA-F]{6})$/);
  if (hex) return `#${hex[1].toUpperCase()}`;

  return text.replace(/\s+/g, " ");
}

function normalizeScheduleTimeInput(value) {
  const text = String(value || "").trim();
  if (!text) return "";

  const match = text.match(/^(\d{1,2}):(\d{2})$/);
  if (!match) return text;

  let hour = Number(match[1]);
  const minute = match[2];
  const meridiem = hour >= 12 ? "PM" : "AM";
  if (hour === 0) hour = 12;
  else if (hour > 12) hour -= 12;
  return `${hour}:${minute} ${meridiem}`;
}

function scheduleTimeToMinutes(value) {
  const text = String(value || "").trim();
  const match = text.match(/^(\d{1,2}):(\d{2})\s*(AM|PM)?$/i);
  if (!match) return 99999;

  let hour = Number(match[1]);
  const minute = Number(match[2]);
  const meridiem = String(match[3] || "").toUpperCase();
  if (meridiem === "PM" && hour < 12) hour += 12;
  if (meridiem === "AM" && hour === 12) hour = 0;
  return hour * 60 + minute;
}

/* DAILY SCHEDULE INFO */
async function saveDailyInfo() {
  const payload = {
    Day: document.getElementById("dailyInfoDay").value,
    EntryGate: document.getElementById("dailyInfoEntryGate").value.trim(),
    ExitGate: document.getElementById("dailyInfoExitGate").value.trim(),
    Uniform: document.getElementById("dailyInfoUniform").value.trim(),
    Publish: document.getElementById("dailyInfoPublish").value
  };

  if (!payload.Day || !payload.EntryGate || !payload.ExitGate || !payload.Uniform) {
    showToast("Day, entry gate, exit gate, and uniform are required.");
    return;
  }

  const saved = await sendAdminData("dailyInfo", payload);

  if (saved) {
    clearFields([
      "dailyInfoEntryGate",
      "dailyInfoExitGate",
      "dailyInfoUniform",
      "dailyInfoPublish"
    ]);
  }
}

/* MANAGE EXISTING DATA - EDIT / HIDE / DELETE */
async function loadAdminTable(sheetName, buttonEl) {
  currentAdminSheet = sheetName;
  selectedAdminRows = new Set();

  setActiveManageTab(buttonEl);
  setManageStatus(`Loading ${formatSheetLabel(sheetName)}...`);

  const tableHead = document.querySelector("#adminDataTable thead");
  const tableBody = document.querySelector("#adminDataTable tbody");

  if (!tableHead || !tableBody) {
    showToast("Manage table not found in admin.html.");
    return;
  }

  tableHead.innerHTML = "";
  tableBody.innerHTML = "";

  try {
    const response = await fetch(`${ADMIN_API_URL}?type=adminList&sheet=${encodeURIComponent(sheetName)}`, {
      cache: "no-store"
    });

    const result = await response.json();

    if (result.status !== "success") {
      setManageStatus(result.message || "Unable to load data.");
      return;
    }

    latestAdminTableData = result;
    resetAdminManageFilters();
    renderAdminTable(getAdminFilteredTableData());

  } catch (error) {
    console.error(error);
    setManageStatus("Error loading data.");
  }
}


function getVisibleManageColumnIndexes(headers) {
  const seen = new Set();

  return (headers || [])
    .map((header, index) => ({ header, index }))
    .filter(item => {
      const key = normalizeManageHeaderKey(item.header);

      if (!key) return true;

      if (seen.has(key)) return false;

      seen.add(key);
      return true;
    })
    .map(item => item.index);
}

function normalizeManageHeaderKey(header) {
  return String(header || "")
    .trim()
    .toLowerCase()
    .replace(/[\s_\-]+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function getAdminManageFilters() {
  return {
    search: document.getElementById("adminManageSearch")?.value.trim().toLowerCase() || "",
    publish: document.getElementById("adminPublishFilter")?.value || "all"
  };
}

function resetAdminManageFilters() {
  const search = document.getElementById("adminManageSearch");
  const publish = document.getElementById("adminPublishFilter");
  if (search) search.value = "";
  if (publish) publish.value = "all";
}

function getRowPublishValue(headers, row) {
  const publishIndex = (headers || []).findIndex(header => {
    const key = normalizeManageHeaderKey(header);
    return key === "publish" || key === "published";
  });

  if (publishIndex === -1) return "YES";
  return String(row?.cells?.[publishIndex] || "YES").trim().toUpperCase();
}

function rowMatchesManageFilters(headers, row, filters) {
  const publish = getRowPublishValue(headers, row);

  if (filters.publish === "published" && publish === "NO") return false;
  if (filters.publish === "hidden" && publish !== "NO") return false;

  if (!filters.search) return true;

  const haystack = [
    row.rowNumber,
    ...(row.cells || [])
  ].join(" ").toLowerCase();

  return haystack.includes(filters.search);
}

function getAdminFilteredTableData() {
  if (!latestAdminTableData) return null;

  const filters = getAdminManageFilters();
  const allRows = latestAdminTableData.rows || [];
  const rows = allRows.filter(row => rowMatchesManageFilters(latestAdminTableData.headers || [], row, filters));

  currentAdminFilteredRows = rows;

  return {
    ...latestAdminTableData,
    rows,
    totalRows: allRows.length
  };
}

function applyAdminManageFilters() {
  if (!latestAdminTableData) return;

  const filteredData = getAdminFilteredTableData();
  const visibleRows = new Set(currentAdminFilteredRows.map(row => Number(row.rowNumber)));
  selectedAdminRows = new Set([...selectedAdminRows].filter(rowNumber => visibleRows.has(Number(rowNumber))));
  renderAdminTable(filteredData);
  syncAdminSelectedRows();
}

function renderAdminTable(result) {
  const tableHead = document.querySelector("#adminDataTable thead");
  const tableBody = document.querySelector("#adminDataTable tbody");

  if (!result) return;

  const headers = result.headers || [];
  const rows = result.rows || [];
  const totalRows = Number.isFinite(result.totalRows) ? result.totalRows : rows.length;
  const isAnnouncementsSheet = result.sheetName === "Announcements";
  const visibleColumnIndexes = getVisibleManageColumnIndexes(headers);

  if (!tableHead || !tableBody) return;

  if (headers.length === 0) {
    tableHead.innerHTML = "";
    tableBody.innerHTML = "";
    setManageStatus(`${formatSheetLabel(result.sheetName)} has no headers.`);
    return;
  }

  tableHead.innerHTML = `
    <tr>
      <th>Select</th>
      <th>Actions</th>
      <th>Row</th>
      ${isAnnouncementsSheet ? "<th>Noted</th>" : ""}
      ${visibleColumnIndexes.map(index => `<th>${escapeHtml(getManageHeaderLabel(result.sheetName, headers[index]))}</th>`).join("")}
    </tr>
  `;

  if (rows.length === 0) {
    tableBody.innerHTML = `
      <tr>
        <td colspan="${visibleColumnIndexes.length + 3 + (isAnnouncementsSheet ? 1 : 0)}" class="emptyCell">
          ${totalRows > 0 ? "No matching records found." : "No data found."}
        </td>
      </tr>
    `;

    setManageStatus(totalRows > 0
      ? `${formatSheetLabel(result.sheetName)} loaded. Showing 0 of ${totalRows} record(s).`
      : `${formatSheetLabel(result.sheetName)} loaded. No records yet.`
    );
    return;
  }

  tableBody.innerHTML = rows.map(row => {
    return `
      <tr>
        <td class="selectCell" data-label="Select">
          <input type="checkbox" class="rowSelectInput" data-row="${row.rowNumber}" onchange="toggleAdminRowSelection(${row.rowNumber}, this.checked)" />
        </td>

        <td class="actionsDataCell" data-label="Actions">
          <div class="actionCell">
            <button class="tableActionBtn editBtn" onclick="openEditModal(${row.rowNumber})">Edit</button>
            <button class="tableActionBtn hideBtn" onclick="hideAdminRecord(${row.rowNumber})">Hide</button>
            <button class="tableActionBtn deleteBtn" onclick="deleteAdminRecord(${row.rowNumber})">Delete</button>
          </div>
        </td>

        <td class="rowNumberCell" data-label="Row">#${row.rowNumber}</td>

        ${isAnnouncementsSheet ? renderAdminNotedCountCell(row) : ""}

        ${visibleColumnIndexes.map(index => {
          const header = headers[index];
          const value = row.cells[index] || "";
          return `
            <td class="${value ? "" : "emptyCell"}" data-label="${escapeAttribute(getManageHeaderLabel(result.sheetName, header))}">
              ${formatManageCellDisplay(value)}
            </td>
          `;
        }).join("")}
      </tr>
    `;
  }).join("");

  setManageStatus(`${formatSheetLabel(result.sheetName)} loaded. ${rows.length}${totalRows !== rows.length ? ` of ${totalRows}` : ""} record(s) shown.`);
  attachAdminLongPressSelection();
}


function formatManageCellDisplay(value) {
  if (!value) return "—";

  if (typeof isRichTextStorageValue === "function" && isRichTextStorageValue(value)) {
    const safeHtml = sanitizeRichEditorHtml(getRichTextStorageHtml(value));
    return safeHtml ? `<div class="manageRichPreview">${safeHtml}</div>` : "—";
  }

  return escapeHtml(stripTextFormatTag(value));
}

function renderAdminNotedCountCell(row) {
  const count = getManageHeartCount(row);

  return `
    <td class="adminNotedCountCell" data-label="Noted" title="Students who clicked Noted / Heart">
      <span class="adminNotedPill">❤️ ${count}</span>
    </td>
  `;
}


function getManageHeartCount(row) {
  const users = normalizeManageHeartUsers(row?.HeartUsersV2 || row?.heartUsersV2 || row?.NotedDevicesV2 || row?.notedDevicesV2);
  const mapCount = Object.keys(users).length;
  if (mapCount > 0) return mapCount;
  const values = [row?.NotedCountV2, row?.notedCountV2, row?.HeartCountV2, row?.heartCountV2]
    .map(value => Number(value))
    .filter(value => Number.isFinite(value) && value >= 0);
  return values.length ? Math.max(...values) : 0;
}

function normalizeManageHeartUsers(value) {
  if (!value || typeof value !== "object" || Array.isArray(value)) return {};
  return Object.fromEntries(Object.entries(value).filter(([key, isHearted]) => key && Boolean(isHearted)));
}

function toggleAdminRowSelection(rowNumber, checked) {
  const numericRow = Number(rowNumber);

  if (checked) {
    selectedAdminRows.add(numericRow);
  } else {
    selectedAdminRows.delete(numericRow);
  }

  syncAdminSelectedRows();
}

function syncAdminSelectedRows() {
  document.querySelectorAll("#adminDataTable tbody tr").forEach(row => {
    const checkbox = row.querySelector(".rowSelectInput");
    if (!checkbox) return;

    const rowNumber = Number(checkbox.dataset.row);
    const selected = selectedAdminRows.has(rowNumber);
    checkbox.checked = selected;
    row.classList.toggle("selectedRow", selected);
  });

  const count = selectedAdminRows.size;
  if (currentAdminSheet && latestAdminTableData) {
    const visibleCount = currentAdminFilteredRows.length || 0;
    const totalCount = latestAdminTableData.rows.length;
    setManageStatus(`${formatSheetLabel(currentAdminSheet)} loaded. ${visibleCount}${visibleCount !== totalCount ? ` of ${totalCount}` : ""} record(s) shown. ${count} selected.`);
  }
}

function selectAllAdminRows() {
  if (!latestAdminTableData || !latestAdminTableData.rows) return;
  const rows = getAdminFilteredTableData()?.rows || [];
  selectedAdminRows = new Set(rows.map(row => Number(row.rowNumber)));
  syncAdminSelectedRows();
}

function clearAdminSelection() {
  selectedAdminRows = new Set();
  syncAdminSelectedRows();
}

function attachAdminLongPressSelection() {
  document.querySelectorAll("#adminDataTable tbody tr").forEach(row => {
    const checkbox = row.querySelector(".rowSelectInput");
    if (!checkbox) return;

    const rowNumber = Number(checkbox.dataset.row);
    let timer = null;

    row.addEventListener("touchstart", () => {
      timer = setTimeout(() => {
        toggleAdminRowSelection(rowNumber, !selectedAdminRows.has(rowNumber));
      }, 550);
    }, { passive: true });

    row.addEventListener("touchend", () => clearTimeout(timer));
    row.addEventListener("touchmove", () => clearTimeout(timer));
    row.addEventListener("touchcancel", () => clearTimeout(timer));
  });
}

async function hideSelectedAdminRecords() {
  await runAdminBatchAction("adminBatchUnpublish", "hide");
}

async function deleteSelectedAdminRecords() {
  await runAdminBatchAction("adminBatchDelete", "delete");
}

async function runAdminBatchAction(type, actionLabel) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const rowNumbers = Array.from(selectedAdminRows).sort((a, b) => a - b);

  if (rowNumbers.length === 0) {
    showToast("Select at least one record.");
    return;
  }

  const confirmed = confirm(`${actionLabel === "delete" ? "Delete" : "Hide"} ${rowNumbers.length} selected record(s)?`);
  if (!confirmed) return;

  if (actionLabel === "delete") {
    const secondConfirm = confirm("Last check: delete permanently? This cannot be undone.");
    if (!secondConfirm) return;
  }

  showToast(`${actionLabel === "delete" ? "Deleting" : "Hiding"} selected records...`);

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type,
        payload: {
          sheetName: currentAdminSheet,
          rowNumbers
        }
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      if (actionLabel === "hide") {
        showToastAction(result.message || "Selected records hidden.", "Undo", () => restoreAdminRecords(rowNumbers));
      } else {
        showToast(result.message || "Batch action complete.");
      }
      selectedAdminRows = new Set();
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Batch action failed.");
  } catch (error) {
    console.error(error);
    showToast("Error running batch action.");
  }
}

function openEditModal(rowNumber) {
  if (!latestAdminTableData) {
    showToast("Load a category first.");
    return;
  }

  const row = latestAdminTableData.rows.find(item => Number(item.rowNumber) === Number(rowNumber));

  if (!row) {
    showToast("Record not found.");
    return;
  }

  editingRecord = {
    sheetName: latestAdminTableData.sheetName,
    rowNumber: row.rowNumber,
    headers: latestAdminTableData.headers,
    cells: row.cells
  };

  const modalTitle = document.getElementById("editModalTitle");
  const modalSubtitle = document.getElementById("editModalSubtitle");
  const editFields = document.getElementById("editFields");
  const editModal = document.getElementById("editModal");

  if (!modalTitle || !modalSubtitle || !editFields || !editModal) {
    showToast("Edit modal not found in admin.html.");
    return;
  }

  modalTitle.textContent = `Edit ${formatSheetLabel(editingRecord.sheetName)}`;
  modalSubtitle.textContent = `Editing row #${editingRecord.rowNumber}`;

  editFields.innerHTML = editingRecord.headers.map((header, index) => {
    const value = editingRecord.cells[index] || "";
    const lowerHeader = String(header).trim().toLowerCase();
    const labelText = getManageHeaderLabel(editingRecord.sheetName, header);

    const isLongText = isFormattedTextField(
      editingRecord.sheetName,
      header,
      index,
      editingRecord.headers
    );
    const isDuplicateAnnouncementField =
      editingRecord.sheetName === "Announcements" &&
      normalizeFieldName(header) === "announcement" &&
      !isLongText;

    if (isDuplicateAnnouncementField) {
      return "";
    }

    const isPublish =
	  lowerHeader === "publish" ||
	  lowerHeader === "published";

	const isTeacher =
	  lowerHeader === "teacher";

	const isId =
	  lowerHeader === "id";
    const isAnnouncementScheduleDate =
      editingRecord.sheetName === "Announcements" &&
      ["publishdate", "expirydate"].includes(normalizeFieldName(header));

    const fieldClass = isLongText ? "editField editFieldFull" : "editField";

    if (isId) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <input 
        class="editInput readOnlyField"
        data-index="${index}"
        value="${escapeAttribute(value)}"
        readonly
      />
    </div>
  `;
}

if (isPublish) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <select class="editInput" data-index="${index}">
        <option value="YES" ${String(value).toUpperCase() === "YES" ? "selected" : ""}>YES</option>
        <option value="NO" ${String(value).toUpperCase() === "NO" ? "selected" : ""}>NO</option>
      </select>
    </div>
  `;
}

if (isAnnouncementScheduleDate) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <input
        class="editInput"
        type="date"
        data-index="${index}"
        value="${escapeAttribute(toDateInputValue(value))}"
      />
    </div>
  `;
}

if (isTeacher) {
  return `
    <div class="${fieldClass}">
      <label>${escapeHtml(labelText)}</label>
      <select class="editInput" data-index="${index}">
        ${renderTeacherOptions(value)}
      </select>
    </div>
  `;
}

    if (isLongText) {
      if (isRichTextStorageValue(value)) {
        const targetId = `editRichText_${index}`;
        const safeHtml = sanitizeRichEditorHtml(getRichTextStorageHtml(value));

        return `
          <div class="${fieldClass}">
            <label>${escapeHtml(labelText)}</label>
            <div class="richComposer editRichComposer" data-rich-target="${targetId}">
              ${getRichEditorToolbarMarkup("Edit formatting tools")}
              <div class="richEditor" contenteditable="true" data-placeholder="Edit formatted text here...">${safeHtml}</div>
              <textarea id="${targetId}" class="editInput richHiddenTextarea" data-rich-storage="YES" data-index="${index}" aria-hidden="true" tabindex="-1"></textarea>
            </div>
          </div>
        `;
      }

      const parsedFormat = parseTextFormat(value);

      return `
        <div class="${fieldClass}">
          <label>${escapeHtml(labelText)}</label>
          <select class="editFormatSelect" data-index="${index}">
            ${renderTextFormatOptions(parsedFormat.format)}
          </select>
          <textarea class="editInput textFormatInput" data-format-enabled="YES" data-index="${index}">${escapeHtml(parsedFormat.text)}</textarea>
        </div>
      `;
    }

    return `
      <div class="${fieldClass}">
        <label>${escapeHtml(labelText)}</label>
        <input 
          class="editInput"
          data-index="${index}"
          value="${escapeAttribute(stripTextFormatTag(value))}"
        />
      </div>
    `;
  }).join("");

  editModal.classList.remove("hidden");
  initRichTextEditors();
}

function closeEditModal() {
  const modal = document.getElementById("editModal");
  if (modal) {
    modal.classList.add("hidden");
  }

  editingRecord = null;
}

async function saveEditedRecord() {
  if (!editingRecord) {
    showToast("No record selected.");
    return;
  }

  const inputs = document.querySelectorAll(".editInput");
  const updatedValues = [...editingRecord.cells];

  inputs.forEach(input => {
    const index = Number(input.dataset.index);
    if (input.dataset.richStorage === "YES") {
      updatedValues[index] = getRichEditorStorageValue(input.id);
    } else if (input.dataset.formatEnabled === "YES") {
      const formatSelect = document.querySelector(`.editFormatSelect[data-index="${index}"]`);
      updatedValues[index] = applyTextFormat(input.value.trim(), formatSelect ? formatSelect.value : "left");
    } else {
      updatedValues[index] = input.value;
    }
  });

  showToast("Saving changes...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminUpdate",
        payload: {
          sheetName: editingRecord.sheetName,
          rowNumber: editingRecord.rowNumber,
          values: updatedValues
        }
      })
    });

    const responseText = await response.text();
    let result = {};

    try {
      result = JSON.parse(responseText);
    } catch (parseError) {
      throw new Error(responseText.slice(0, 180) || "Invalid server response.");
    }

    if (result.success) {
      showToast("Record updated.");
      closeEditModal();
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to update record.");

  } catch (error) {
    console.error(error);
    showToast(`Error updating record: ${error.message || "unknown error"}`);
  }
}

async function hideAdminRecord(rowNumber) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const confirmed = confirm("Hide this record? This will set Publish to NO.");

  if (!confirmed) return;

  showToast("Hiding record...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminUnpublish",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      showToastAction("Record hidden.", "Undo", () => restoreAdminRecords([rowNumber]));
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to hide record.");

  } catch (error) {
    console.error(error);
    showToast("Error hiding record.");
  }
}

async function deleteAdminRecord(rowNumber) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const confirmed = confirm("Delete this record permanently? This cannot be undone.");

  if (!confirmed) return;

  const secondConfirm = confirm("Last check: delete this record now?");
  if (!secondConfirm) return;

  showToast("Deleting record...");

  try {
    const response = await fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminDelete",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    });

    const result = await response.json();

    if (result.success) {
      showToast("Record deleted.");
      refreshCurrentAdminTable();
      return;
    }

    showToast(result.message || "Failed to delete record.");

  } catch (error) {
    console.error(error);
    showToast("Error deleting record.");
  }
}

async function restoreAdminRecords(rowNumbers) {
  if (!currentAdminSheet) {
    showToast("Select a category first.");
    return;
  }

  const rows = (rowNumbers || []).map(Number).filter(rowNumber => rowNumber >= 2);
  if (rows.length === 0) return;

  showToast("Restoring record...");

  try {
    await Promise.all(rows.map(rowNumber => fetch(ADMIN_API_URL, {
      method: "POST",
      body: JSON.stringify({
        type: "adminRestore",
        payload: {
          sheetName: currentAdminSheet,
          rowNumber
        }
      })
    }).then(async response => {
      const result = await response.json();
      if (!result.success) throw new Error(result.message || "Restore failed.");
      return result;
    })));

    showToast(rows.length === 1 ? "Record restored." : `${rows.length} records restored.`);
    refreshCurrentAdminTable();
  } catch (error) {
    console.error(error);
    showToast(error.message || "Error restoring record.");
  }
}

function refreshCurrentAdminTable() {
  if (!currentAdminSheet) {
    setManageStatus("Select a category first.");
    return;
  }

  loadAdminTable(currentAdminSheet);
}

function setActiveManageTab(buttonEl) {
  document.querySelectorAll(".manageTabs button").forEach(btn => {
    btn.classList.remove("active");
  });

  if (buttonEl) {
    buttonEl.classList.add("active");
    return;
  }

  const buttons = document.querySelectorAll(".manageTabs button");

  buttons.forEach(btn => {
    const onclickValue = btn.getAttribute("onclick") || "";

    if (onclickValue.includes(currentAdminSheet)) {
      btn.classList.add("active");
    }
  });
}

function setManageStatus(message) {
  const status = document.getElementById("manageStatus");
  if (status) {
    status.textContent = message;
  }
}

function isFormattedTextField(sheetName, header, index, headers = []) {
  const cleanHeader = normalizeFieldName(header);
  const hasIdColumn = normalizeFieldName(headers[0] || "") === "id";

  if (sheetName === "Announcements") {
    return hasIdColumn ? index === 3 : index === 2;
  }

  if (sheetName === "ThingsToBring") {
    return index === 2;
  }

  if (sheetName === "AdviserReminders") {
    return index === 1;
  }

  if (sheetName === "DailyQuotes") {
    return index === 1;
  }

  if (sheetName === "TickerMessages") {
    return index === 0;
  }

  const formattedFields = {
    ThingsToBring: ["item", "things", "materials", "reminder", "description", "task"],
    AdviserReminders: ["reminder", "message", "description"],
    DailyQuotes: ["quote"],
    TickerMessages: ["message"]
  };

  return (formattedFields[sheetName] || []).includes(cleanHeader);
}

function normalizeFieldName(value) {
  return String(value || "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, "")
    .replace(/[^a-z0-9]/g, "");
}

function applyTextFormat(text, format) {
  const cleanText = stripTextFormatTag(text).trim();
  const cleanFormat = TEXT_FORMAT_OPTIONS.includes(format) ? format : "left";

  if (!cleanText) return "";

  return `[${cleanFormat}]\n${cleanText}`;
}

function parseTextFormat(value) {
  const raw = String(value || "").replace(/\r/g, "").trim();
  const match = raw.match(/^\[(center|left|right|bullets|numbers)\]\s*\n?/i);

  if (!match) {
    return {
      format: "left",
      text: raw
    };
  }

  return {
    format: match[1].toLowerCase(),
    text: raw.replace(match[0], "").trim()
  };
}

function stripTextFormatTag(value) {
  return String(value || "")
    .replace(/\r/g, "")
    .replace(/^\[(center|left|right|bullets|numbers)\]\s*\n?/i, "");
}

function renderTextFormatOptions(selectedValue) {
  const labels = {
    center: "Center",
    left: "Left",
    right: "Right",
    bullets: "Bullets",
    numbers: "Numbers"
  };

  return TEXT_FORMAT_OPTIONS.map(value => {
    const selected = value === selectedValue ? "selected" : "";
    return `<option value="${value}" ${selected}>${labels[value]}</option>`;
  }).join("");
}

function formatSheetLabel(sheetName) {
  const labels = {
    Announcements: "Announcements",
    ThingsToBring: "Things to Bring",
    AdviserReminders: "Adviser Reminders",
    PrayerLeaders: "Prayer Leaders",
    DailyQuotes: "Daily Quotes",
    Birthdays: "Birthdays",
    TickerMessages: "Ticker Messages",
    DailyInfo: "Daily Info"
  };

  return labels[sheetName] || sheetName;
}

function getManageHeaderLabel(sheetName, header) {
  const rawHeader = String(header || "").trim();
  const key = normalizeManageHeaderKey(rawHeader);

  if (sheetName === "ThingsToBring" && key === "date") {
    return "Date Needed";
  }

  return rawHeader || header;
}

function escapeHtml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function escapeAttribute(value) {
  return escapeHtml(value).replaceAll("`", "&#096;");
}

function toDateInputValue(value) {
  const text = String(value || "").trim();
  const isoMatch = text.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (isoMatch) return `${isoMatch[1]}-${isoMatch[2]}-${isoMatch[3]}`;
  const date = new Date(text);
  if (!Number.isFinite(date.getTime())) return "";
  return date.toLocaleDateString("en-CA", { timeZone: "Asia/Manila" });
}

function renderTeacherOptions(selectedValue) {
  const selected = String(selectedValue || "").trim();

  let options = `<option value="">Select Teacher</option>`;

  TEACHER_OPTIONS.forEach(teacher => {
    options += `
      <option value="${escapeAttribute(teacher)}" ${selected === teacher ? "selected" : ""}>
        ${escapeHtml(teacher)}
      </option>
    `;
  });

  if (selected && !TEACHER_OPTIONS.includes(selected)) {
    options += `
      <option value="${escapeAttribute(selected)}" selected>
        ${escapeHtml(selected)}
      </option>
    `;
  }

  return options;
}


/* HOMEPAGE DESIGN SETTINGS - v69 DESIGN STUDIO */
const HOMEPAGE_DESIGN_FIELDS = {
  "HomepageBgColor": "designHomepageBgColor",
  "HomepageTextColor": "designHomepageTextColor",
  "HomepageCardBgColor": "designCardBgColor",
  "HomepageCardTextColor": "designCardTextColor",
  "HomepageCardBorderColor": "designCardBorderColor",
  "HomepageCardShadowColor": "designCardShadowColor",
  "HomepageAccentColor": "designAccentColor",
  "HomepageAccentTextColor": "designAccentTextColor",
  "HomepageCardRadius": "designCardRadius",
  "HomepageShadowStyle": "designShadowStyle",
  "HomepageTopbarBg": "designTopbarBg",
  "HomepageTopbarText": "designTopbarText",
  "HomepageBrandTitleColor": "designBrandTitleColor",
  "HomepageBrandSubtitleColor": "designBrandSubtitleColor",
  "HomepageQuoteBg": "designQuoteBg",
  "HomepageQuoteText": "designQuoteText",
  "HomepageQuoteLabelBg": "designQuoteLabelBg",
  "HomepageQuoteLabelText": "designQuoteLabelText",
  "HomepageTimeBoxBg": "designTimeBoxBg",
  "HomepageTimeBoxText": "designTimeBoxText",
  "HomepageQuoteLabelTextValue": "designQuoteLabelTextValue",
  "HomepageAutoSubjectTheme": "designAutoSubjectTheme",
  "HomepageUseSubjectPeriodColors": "designUseSubjectPeriodColors",
  "HomepageOverridePeriodTextColors": "designOverridePeriodTextColors",
  "HomepageCurrentLabelText": "designCurrentLabelText",
  "HomepageCurrentLabelColor": "designCurrentLabelColor",
  "HomepageCurrentCardBg": "designCurrentCardBg",
  "HomepageCurrentSubjectColor": "designCurrentSubjectColor",
  "HomepageCurrentDetailsColor": "designCurrentDetailsColor",
  "HomepageCurrentCountdownBg": "designCurrentCountdownBg",
  "HomepageCurrentCountdownText": "designCurrentCountdownText",
  "HomepageNextLabelText": "designNextLabelText",
  "HomepageNextLabelColor": "designNextLabelColor",
  "HomepageNextCardBg": "designNextCardBg",
  "HomepageNextSubjectColor": "designNextSubjectColor",
  "HomepageNextDetailsColor": "designNextDetailsColor",
  "HomepageNextCountdownBg": "designNextCountdownBg",
  "HomepageNextCountdownText": "designNextCountdownText",
  "HomepageUseSubjectScheduleColors": "designUseSubjectScheduleColors",
  "HomepageTodayScheduleTitle": "designTodayScheduleTitle",
  "HomepageScheduleTitleColor": "designScheduleTitleColor",
  "HomepageSchedulePanelBg": "designSchedulePanelBg",
  "HomepageScheduleCardBg": "designScheduleCardBg",
  "HomepageScheduleCardText": "designScheduleCardText",
  "HomepageScheduleTimeColor": "designScheduleTimeColor",
  "HomepageScheduleDetailsColor": "designScheduleDetailsColor",
  "HomepageScheduleCurrentBadgeBg": "designScheduleCurrentBadgeBg",
  "HomepageScheduleCurrentBadgeText": "designScheduleCurrentBadgeText",
  "HomepageScheduleButtonBg": "designScheduleButtonBg",
  "HomepageScheduleButtonText": "designScheduleButtonText",
  "HomepageAnnouncementsTitleText": "designAnnouncementsTitleText",
  "HomepageAnnouncementsTitleColor": "designAnnouncementsTitleColor",
  "HomepageAnnouncementPanelBg": "designAnnouncementPanelBg",
  "HomepageAnnouncementCardBg": "designAnnouncementCardBg",
  "HomepageAnnouncementTextColor": "designAnnouncementTextColor",
  "HomepageAnnouncementChipBg": "designAnnouncementChipBg",
  "HomepageAnnouncementChipText": "designAnnouncementChipText",
  "HomepageAnnouncementButtonBg": "designAnnouncementButtonBg",
  "HomepageAnnouncementButtonText": "designAnnouncementButtonText",
  "HomepageThingsTitleText": "designThingsTitleText",
  "HomepageThingsTitleColor": "designThingsTitleColor",
  "HomepageThingsPanelBg": "designThingsPanelBg",
  "HomepageThingsItemBg": "designThingsItemBg",
  "HomepageThingsItemText": "designThingsItemText",
  "HomepageThingsSubjectText": "designThingsSubjectText",
  "HomepageThingsStatusBg": "designThingsStatusBg",
  "HomepageThingsStatusText": "designThingsStatusText",
  "HomepageThingsSummaryBg": "designThingsSummaryBg",
  "HomepageThingsSummaryText": "designThingsSummaryText",
  "HomepagePrayerLabelText": "designPrayerLabelText",
  "HomepagePrayerLabelColor": "designPrayerLabelColor",
  "HomepagePrayerCardBg": "designPrayerCardBg",
  "HomepagePrayerCardBorder": "designPrayerCardBorder",
  "HomepagePrayerCardText": "designPrayerCardText",
  "HomepagePrayerNameColor": "designPrayerNameColor",
  "HomepagePrayerDividerColor": "designPrayerDividerColor",
  "HomepagePrayerLinkHoverBg": "designPrayerLinkHoverBg",
  "HomepageCleanersLabelText": "designCleanersLabelText",
  "HomepageCleanersBoxBg": "designCleanersBoxBg",
  "HomepageCleanersBorderColor": "designCleanersBorderColor",
  "HomepageCleanersLabelColor": "designCleanersLabelColor",
  "HomepageCleanersTextColor": "designCleanersTextColor",
  "HomepageCleanersShadowColor": "designCleanersShadowColor",
  "HomepageBirthdayLabelText": "designBirthdayLabelText",
  "HomepageBirthdayLabelColor": "designBirthdayLabelColor",
  "HomepageBirthdayCardBg": "designBirthdayCardBg",
  "HomepageBirthdayCardBorder": "designBirthdayCardBorder",
  "HomepageBirthdayCardAccent": "designBirthdayCardAccent",
  "HomepageBirthdayDateBg": "designBirthdayDateBg",
  "HomepageBirthdayDateTextColor": "designBirthdayDateTextColor",
  "HomepageBirthdayDateBorder": "designBirthdayDateBorder",
  "HomepageBirthdayInnerBg": "designBirthdayInnerBg",
  "HomepageBirthdayInnerBorder": "designBirthdayInnerBorder",
  "HomepageBirthdayIconBg": "designBirthdayIconBg",
  "HomepageBirthdayIconText": "designBirthdayIconText",
  "HomepageBirthdayGreetingColor": "designBirthdayGreetingColor",
  "HomepageBirthdayCelebrantColor": "designBirthdayCelebrantColor",
  "HomepageBirthdayMessageColor": "designBirthdayMessageColor",
  "HomepageBirthdayEmptyBg": "designBirthdayEmptyBg",
  "HomepageBirthdayEmptyText": "designBirthdayEmptyText",
  "HomepageBirthdayTextColor": "designBirthdayTextColor",
  "HomepageAdviserRemindersTitleText": "designAdviserRemindersTitleText",
  "HomepageAdviserRemindersTitleColor": "designAdviserRemindersTitleColor",
  "HomepageTickerBg": "designTickerBg",
  "HomepageTickerText": "designTickerText"
};

const HOMEPAGE_DESIGN_DEFAULTS = {
  "HomepageBgColor": "#f7c600",
  "HomepageTextColor": "#111111",
  "HomepageCardBgColor": "#ffffff",
  "HomepageCardTextColor": "#111111",
  "HomepageCardBorderColor": "#111111",
  "HomepageCardShadowColor": "#111111",
  "HomepageAccentColor": "#f7c600",
  "HomepageAccentTextColor": "#111111",
  "HomepageCardRadius": "16px",
  "HomepageShadowStyle": "classic",
  "HomepageTopbarBg": "#111111",
  "HomepageTopbarText": "#ffffff",
  "HomepageBrandTitleColor": "#ffffff",
  "HomepageBrandSubtitleColor": "#ffd700",
  "HomepageQuoteBg": "#1f1f1f",
  "HomepageQuoteText": "#ffffff",
  "HomepageQuoteLabelBg": "#ffd700",
  "HomepageQuoteLabelText": "#111111",
  "HomepageTimeBoxBg": "#ffd700",
  "HomepageTimeBoxText": "#111111",
  "HomepageQuoteLabelTextValue": "Daily Kindness Quote",
  "HomepageAutoSubjectTheme": "NO",
  "HomepageUseSubjectPeriodColors": "YES",
  "HomepageOverridePeriodTextColors": "NO",
  "HomepageCurrentLabelText": "Current Period",
  "HomepageCurrentLabelColor": "#ffd700",
  "HomepageCurrentCardBg": "#111111",
  "HomepageCurrentSubjectColor": "#ffffff",
  "HomepageCurrentDetailsColor": "#ffffff",
  "HomepageCurrentCountdownBg": "#ffd700",
  "HomepageCurrentCountdownText": "#111111",
  "HomepageNextLabelText": "Next Period",
  "HomepageNextLabelColor": "#111111",
  "HomepageNextCardBg": "#fff7c7",
  "HomepageNextSubjectColor": "#111111",
  "HomepageNextDetailsColor": "#111111",
  "HomepageNextCountdownBg": "#111111",
  "HomepageNextCountdownText": "#ffffff",
  "HomepageUseSubjectScheduleColors": "YES",
  "HomepageTodayScheduleTitle": "Today's Schedule",
  "HomepageScheduleTitleColor": "#111111",
  "HomepageSchedulePanelBg": "#ffffff",
  "HomepageScheduleCardBg": "#ffffff",
  "HomepageScheduleCardText": "#111111",
  "HomepageScheduleTimeColor": "#111111",
  "HomepageScheduleDetailsColor": "#111111",
  "HomepageScheduleCurrentBadgeBg": "#111111",
  "HomepageScheduleCurrentBadgeText": "#ffd700",
  "HomepageScheduleButtonBg": "#111111",
  "HomepageScheduleButtonText": "#ffd700",
  "HomepageAnnouncementsTitleText": "Subject Announcements",
  "HomepageAnnouncementsTitleColor": "#111111",
  "HomepageAnnouncementPanelBg": "#ffffff",
  "HomepageAnnouncementCardBg": "#fff7c7",
  "HomepageAnnouncementTextColor": "#111111",
  "HomepageAnnouncementChipBg": "#111111",
  "HomepageAnnouncementChipText": "#ffd700",
  "HomepageAnnouncementButtonBg": "#111111",
  "HomepageAnnouncementButtonText": "#ffd700",
  "HomepageThingsTitleText": "Things to Bring",
  "HomepageThingsTitleColor": "#111111",
  "HomepageThingsPanelBg": "#ffffff",
  "HomepageThingsItemBg": "#fff7c7",
  "HomepageThingsItemText": "#111111",
  "HomepageThingsSubjectText": "#111111",
  "HomepageThingsStatusBg": "#111111",
  "HomepageThingsStatusText": "#ffd700",
  "HomepageThingsSummaryBg": "#111111",
  "HomepageThingsSummaryText": "#ffd700",
  "HomepagePrayerLabelText": "Prayer Leader",
  "HomepagePrayerLabelColor": "#555555",
  "HomepagePrayerCardBg": "#ffffff",
  "HomepagePrayerCardBorder": "#111111",
  "HomepagePrayerCardText": "#111111",
  "HomepagePrayerNameColor": "#111111",
  "HomepagePrayerDividerColor": "#ffd700",
  "HomepagePrayerLinkHoverBg": "#fff7c7",
  "HomepageCleanersLabelText": "Cleaners Today",
  "HomepageCleanersBoxBg": "#111111",
  "HomepageCleanersBorderColor": "#ffd700",
  "HomepageCleanersLabelColor": "#ffffff",
  "HomepageCleanersTextColor": "#ffd700",
  "HomepageCleanersShadowColor": "#111111",
  "HomepageBirthdayLabelText": "Birthday Corner",
  "HomepageBirthdayLabelColor": "#111111",
  "HomepageBirthdayCardBg": "#fffdf0",
  "HomepageBirthdayCardBorder": "#111111",
  "HomepageBirthdayCardAccent": "#ffd700",
  "HomepageBirthdayDateBg": "#111111",
  "HomepageBirthdayDateTextColor": "#ffd700",
  "HomepageBirthdayDateBorder": "#ffd700",
  "HomepageBirthdayInnerBg": "#111111",
  "HomepageBirthdayInnerBorder": "#ffd700",
  "HomepageBirthdayIconBg": "#ffd700",
  "HomepageBirthdayIconText": "#111111",
  "HomepageBirthdayGreetingColor": "#ffd700",
  "HomepageBirthdayCelebrantColor": "#ffffff",
  "HomepageBirthdayMessageColor": "#f5f5f5",
  "HomepageBirthdayEmptyBg": "#111111",
  "HomepageBirthdayEmptyText": "#ffd700",
  "HomepageBirthdayTextColor": "#111111",
  "HomepageAdviserRemindersTitleText": "Adviser Reminders",
  "HomepageAdviserRemindersTitleColor": "#111111",
  "HomepageTickerBg": "#111111",
  "HomepageTickerText": "#ffd700"
};

const HOMEPAGE_DESIGN_CHECKBOX_KEYS = [
  "HomepageUseSubjectPeriodColors",
  "HomepageOverridePeriodTextColors",
  "HomepageUseSubjectScheduleColors",
  "HomepageAutoSubjectTheme"
];

function normalizeHomepageDesignValue(key, value) {
  if (HOMEPAGE_DESIGN_CHECKBOX_KEYS.includes(key)) {
    return String(value || "").trim().toUpperCase() === "YES" ? "YES" : "NO";
  }
  return String(value || "").trim();
}

function fillHomepageDesignForm(settings = {}) {
  Object.entries(HOMEPAGE_DESIGN_FIELDS).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (!input) return;
    const value = normalizeHomepageDesignValue(key, settings[key] || HOMEPAGE_DESIGN_DEFAULTS[key] || "");
    if (input.type === "checkbox") {
      input.checked = value === "YES";
    } else {
      input.value = value;
    }
  });
}

async function loadHomepageDesignSettings() {
  try {
    const response = await fetch(`${ADMIN_API_URL}?type=settings`, { cache: "no-store" });
    const settings = await response.json();
    fillHomepageDesignForm(settings || {});
  } catch (error) {
    fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
  }
}

function collectHomepageDesignSettings() {
  const payload = {};
  Object.entries(HOMEPAGE_DESIGN_FIELDS).forEach(([key, id]) => {
    const input = document.getElementById(id);
    if (!input) return;
    payload[key] = input.type === "checkbox" ? (input.checked ? "YES" : "NO") : String(input.value || "").trim();
  });
  return payload;
}

async function saveHomepageDesignSettings() {
  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = "Saving homepage design...";
  const saved = await sendAdminData("homepageDesign", collectHomepageDesignSettings());
  if (status) {
    status.textContent = saved
      ? "Saved. Open Homepage or hard refresh to see the design."
      : "Unable to save design settings. Upload firebase-adapter.js v74, open reset-cache.html, then hard refresh this phone.";
  }
}

function resetHomepageDesignForm(ask = false) {
  if (ask && !confirm("Restore the original ClassBoard design in this form? Click Save after this to apply it.")) return;
  fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
  homepagePreviewPresetId = "";
  clearHomepageActivePresetId();
  renderHomepagePresetGallery();
}

async function restoreHomepageDesignDefaults() {
  if (!confirm("Restore original homepage colors and labels now?")) return;
  fillHomepageDesignForm(HOMEPAGE_DESIGN_DEFAULTS);
  homepagePreviewPresetId = "";
  clearHomepageActivePresetId();
  await saveHomepageDesignSettings();
  renderHomepagePresetGallery();
}


function buildHomepagePreset(id, name, category, description, swatches, overrides = {}) {
  return {
    id,
    name,
    category,
    description,
    swatches,
    settings: {
      ...HOMEPAGE_DESIGN_DEFAULTS,
      ...overrides
    }
  };
}

const HOMEPAGE_CUSTOM_PRESETS_KEY = "sfk_homepage_custom_presets_v1";
const HOMEPAGE_ACTIVE_PRESET_KEY = "sfk_homepage_active_preset_v107";
let homepagePreviewPresetId = "";

function getHomepageActivePresetId() {
  try {
    return localStorage.getItem(HOMEPAGE_ACTIVE_PRESET_KEY) || "";
  } catch (error) {
    return "";
  }
}

function setHomepageActivePresetId(id) {
  try {
    localStorage.setItem(HOMEPAGE_ACTIVE_PRESET_KEY, String(id || ""));
  } catch (error) {}
}

function clearHomepageActivePresetId() {
  try {
    localStorage.removeItem(HOMEPAGE_ACTIVE_PRESET_KEY);
  } catch (error) {}
}


function getCustomHomepagePresets() {
  try {
    const raw = localStorage.getItem(HOMEPAGE_CUSTOM_PRESETS_KEY);
    const presets = JSON.parse(raw || "[]");
    if (!Array.isArray(presets)) return [];
    return presets
      .filter(item => item && item.id && item.name && item.settings)
      .map(item => ({
        ...item,
        category: "custom",
        custom: true,
        description: item.description || "Your saved custom homepage design."
      }));
  } catch (error) {
    return [];
  }
}

function saveCustomHomepagePresets(presets = []) {
  localStorage.setItem(HOMEPAGE_CUSTOM_PRESETS_KEY, JSON.stringify(presets));
}

function getAllHomepageThemePresets() {
  return [
    ...HOMEPAGE_THEME_PRESETS,
    ...getCustomHomepagePresets()
  ];
}

function getPresetSwatchesFromSettings(settings = {}) {
  return [
    settings.HomepageBgColor,
    settings.HomepageTopbarBg,
    settings.HomepageCardBgColor,
    settings.HomepageAccentColor,
    settings.HomepageBirthdayCardAccent,
    settings.HomepageCleanersBoxBg
  ].filter(Boolean).slice(0, 6);
}

function saveCurrentDesignAsCustomPreset() {
  const currentSettings = collectHomepageDesignSettings();
  const defaultName = `My Theme ${getCustomHomepagePresets().length + 1}`;
  const name = prompt("Name this custom preset:", defaultName);
  if (!name) return;

  const cleanName = String(name).trim().slice(0, 40);
  if (!cleanName) return;

  const presets = getCustomHomepagePresets();
  const id = `custom-${Date.now()}`;
  const newPreset = {
    id,
    name: cleanName,
    category: "custom",
    custom: true,
    description: "Saved from your edited Homepage Design Studio settings.",
    swatches: getPresetSwatchesFromSettings(currentSettings),
    settings: {
      ...HOMEPAGE_DESIGN_DEFAULTS,
      ...currentSettings
    },
    createdAt: new Date().toISOString()
  };

  presets.push(newPreset);
  saveCustomHomepagePresets(presets);
  const categorySelect = document.getElementById("homepagePresetCategory");
  if (categorySelect) categorySelect.value = "custom";
  renderHomepagePresetGallery();

  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = `"${cleanName}" saved as a custom preset.`;
  showToast(`Custom preset "${cleanName}" saved.`);
}

function deleteCustomHomepagePreset(id) {
  const preset = getCustomHomepagePresets().find(item => item.id === id);
  if (!preset) return;
  if (!confirm(`Delete custom preset "${preset.name}"?`)) return;

  const remaining = getCustomHomepagePresets().filter(item => item.id !== id);
  saveCustomHomepagePresets(remaining);
  if (homepagePreviewPresetId === id) homepagePreviewPresetId = "";
  if (getHomepageActivePresetId() === id) clearHomepageActivePresetId();
  renderHomepagePresetGallery();
  showToast("Custom preset deleted.");
}

const HOMEPAGE_THEME_PRESETS = [
  buildHomepagePreset("autoSubject", "Auto Subject Theme", "modern", "One smart preset: the homepage changes color automatically based on the current subject.", ["#60A5FA", "#C084FC", "#90EE90", "#FFD700", "#333333"], {
    HomepageAutoSubjectTheme: "YES",
    HomepageUseSubjectPeriodColors: "YES",
    HomepageOverridePeriodTextColors: "NO",
    HomepageBgColor: "#f7c600",
    HomepageCardBgColor: "#ffffff",
    HomepageCardTextColor: "#111111",
    HomepageCardBorderColor: "#111111",
    HomepageAccentColor: "#ffd700",
    HomepageTopbarBg: "#111111",
    HomepageTopbarText: "#ffffff",
    HomepageSchedulePanelBg: "#ffffff",
    HomepageAnnouncementPanelBg: "#ffffff",
    HomepageThingsPanelBg: "#ffffff",
    HomepagePrayerCardBg: "#ffffff",
    HomepageBirthdayCardBg: "#fffdf0"
  }),
  buildHomepagePreset("classic", "Original ClassBoard", "classic", "The default yellow, black, and white ClassBoard look.", ["#f7c600", "#111111", "#ffffff", "#ffd700"], {}),
  buildHomepagePreset("schoolGold", "School Gold", "classic", "Bold school-board look with strong black and gold contrast.", ["#f7c600", "#111111", "#ffffff", "#ffd700"], {
    HomepageBgColor: "#f7c600", HomepageTopbarBg: "#111111", HomepageAccentColor: "#ffd700", HomepageScheduleButtonBg: "#111111", HomepageScheduleButtonText: "#ffd700",
    HomepagePrayerDividerColor: "#ffd700", HomepageCleanersBoxBg: "#111111", HomepageCleanersTextColor: "#ffd700", HomepageBirthdayCardAccent: "#ffd700"
  }),
  buildHomepagePreset("sfkPremium", "SFK Premium Gold", "premium", "Premium black-and-gold style, clean and strong for displays.", ["#0b0b0b", "#ffd000", "#fff7cf", "#2b2410"], {
    HomepageBgColor: "#c7a300", HomepageTextColor: "#111111", HomepageCardBgColor: "#fff7cf", HomepageCardTextColor: "#111111", HomepageCardBorderColor: "#0b0b0b", HomepageCardShadowColor: "#0b0b0b",
    HomepageTopbarBg: "#0b0b0b", HomepageTopbarText: "#fff7cf", HomepageBrandSubtitleColor: "#ffd000", HomepageAccentColor: "#ffd000", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0b0b0b", HomepageCurrentSubjectColor: "#ffd000", HomepageCurrentDetailsColor: "#fff7cf", HomepageNextCardBg: "#fff7cf", HomepageNextSubjectColor: "#111111",
    HomepageSchedulePanelBg: "#fff7cf", HomepageAnnouncementPanelBg: "#fff7cf", HomepageThingsPanelBg: "#fff7cf",
    HomepagePrayerCardBg: "#fff7cf", HomepagePrayerCardBorder: "#111111", HomepagePrayerDividerColor: "#ffd000", HomepageCleanersBoxBg: "#111111", HomepageCleanersTextColor: "#ffd000",
    HomepageBirthdayCardBg: "#fff7cf", HomepageBirthdayDateBg: "#111111", HomepageBirthdayDateTextColor: "#ffd000", HomepageBirthdayInnerBg: "#111111", HomepageBirthdayCelebrantColor: "#ffffff"
  }),
  buildHomepagePreset("pastel", "Soft Pastel", "soft", "Soft pink, violet, and gentle classroom colors.", ["#fff1f7", "#f9a8d4", "#7c3aed", "#ffffff"], {
    HomepageBgColor: "#fff1f7", HomepageTopbarBg: "#6d28d9", HomepageCardBorderColor: "#f9a8d4", HomepageAccentColor: "#f9a8d4", HomepageAccentTextColor: "#111111",
    HomepageCurrentLabelColor: "#be185d", HomepageNextLabelColor: "#7c3aed", HomepageScheduleTitleColor: "#be185d", HomepageAnnouncementsTitleColor: "#be185d", HomepageThingsTitleColor: "#7c3aed",
    HomepagePrayerCardBg: "#ffffff", HomepagePrayerDividerColor: "#f9a8d4", HomepageCleanersBoxBg: "#7c3aed", HomepageCleanersTextColor: "#fff1f7",
    HomepageBirthdayCardBg: "#fff1f7", HomepageBirthdayCardAccent: "#f9a8d4", HomepageBirthdayInnerBg: "#7c3aed", HomepageBirthdayGreetingColor: "#f9a8d4", HomepageBirthdayCelebrantColor: "#ffffff"
  }),
  buildHomepagePreset("cottonCandy", "Cotton Candy", "fun", "Cute bright pink and sky blue theme for cheerful classroom vibes.", ["#ffe4f3", "#38bdf8", "#ec4899", "#ffffff"], {
    HomepageBgColor: "#ffe4f3", HomepageTopbarBg: "#0ea5e9", HomepageBrandSubtitleColor: "#ffe4f3", HomepageCardBorderColor: "#38bdf8", HomepageAccentColor: "#ec4899", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#ec4899", HomepageCurrentLabelColor: "#ffffff", HomepageCurrentSubjectColor: "#ffffff", HomepageCurrentDetailsColor: "#fff7fb", HomepageNextCardBg: "#e0f2fe",
    HomepageScheduleTitleColor: "#ec4899", HomepageAnnouncementsTitleColor: "#0ea5e9", HomepageThingsTitleColor: "#ec4899", HomepageCleanersBoxBg: "#0ea5e9", HomepageCleanersTextColor: "#ffffff",
    HomepageBirthdayCardBg: "#fff7fb", HomepageBirthdayCardAccent: "#ec4899", HomepageBirthdayDateBg: "#0ea5e9", HomepageBirthdayInnerBg: "#ec4899", HomepageBirthdayGreetingColor: "#ffffff"
  }),
  buildHomepagePreset("sakura", "Sakura Bloom", "soft", "Warm cherry blossom colors with soft cream panels.", ["#fff1f2", "#fb7185", "#9f1239", "#fff7ed"], {
    HomepageBgColor: "#fff1f2", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#fb7185", HomepageTopbarBg: "#9f1239", HomepageBrandSubtitleColor: "#fecdd3", HomepageAccentColor: "#fb7185", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#9f1239", HomepageCurrentLabelColor: "#fecdd3", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffe4e6",
    HomepageScheduleTitleColor: "#9f1239", HomepageAnnouncementsTitleColor: "#be123c", HomepageThingsTitleColor: "#9f1239", HomepageCleanersBoxBg: "#9f1239", HomepageCleanersTextColor: "#fecdd3",
    HomepageBirthdayCardBg: "#fff7ed", HomepageBirthdayCardAccent: "#fb7185", HomepageBirthdayInnerBg: "#9f1239", HomepageBirthdayGreetingColor: "#fecdd3"
  }),
  buildHomepagePreset("lavender", "Lavender Calm", "soft", "Relaxing purple classroom theme, easy on the eyes.", ["#f5f3ff", "#8b5cf6", "#4c1d95", "#ffffff"], {
    HomepageBgColor: "#f5f3ff", HomepageTopbarBg: "#4c1d95", HomepageCardBorderColor: "#c4b5fd", HomepageAccentColor: "#8b5cf6", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#6d28d9", HomepageCurrentLabelColor: "#ddd6fe", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ede9fe",
    HomepageScheduleTitleColor: "#6d28d9", HomepageAnnouncementsTitleColor: "#6d28d9", HomepageThingsTitleColor: "#4c1d95", HomepageCleanersBoxBg: "#4c1d95", HomepageCleanersTextColor: "#ddd6fe",
    HomepageBirthdayCardBg: "#f5f3ff", HomepageBirthdayCardAccent: "#8b5cf6", HomepageBirthdayDateBg: "#4c1d95", HomepageBirthdayDateTextColor: "#ddd6fe", HomepageBirthdayInnerBg: "#6d28d9"
  }),
  buildHomepagePreset("modernBlue", "Modern Blue", "modern", "Clean blue interface with professional dashboard feel.", ["#dbeafe", "#2563eb", "#0f172a", "#ffffff"], {
    HomepageBgColor: "#dbeafe", HomepageTopbarBg: "#0f172a", HomepageBrandSubtitleColor: "#93c5fd", HomepageAccentColor: "#2563eb", HomepageAccentTextColor: "#ffffff", HomepageCardBorderColor: "#1d4ed8",
    HomepageCurrentLabelText: "Now Learning", HomepageNextLabelText: "Up Next", HomepageCurrentLabelColor: "#dbeafe", HomepageNextLabelColor: "#1d4ed8", HomepageScheduleTitleColor: "#1d4ed8", HomepageAnnouncementsTitleColor: "#1d4ed8", HomepageThingsTitleColor: "#1d4ed8",
    HomepageScheduleButtonBg: "#1d4ed8", HomepageScheduleButtonText: "#ffffff", HomepageCleanersBoxBg: "#0f172a", HomepageCleanersTextColor: "#93c5fd", HomepageBirthdayCardAccent: "#2563eb"
  }),
  buildHomepagePreset("skyClass", "Sky Classroom", "modern", "Light sky theme with clear blue labels and soft panels.", ["#e0f2fe", "#0284c7", "#075985", "#ffffff"], {
    HomepageBgColor: "#e0f2fe", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#7dd3fc", HomepageTopbarBg: "#075985", HomepageBrandSubtitleColor: "#bae6fd", HomepageAccentColor: "#0284c7", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#075985", HomepageCurrentLabelColor: "#bae6fd", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0f9ff",
    HomepageScheduleTitleColor: "#0369a1", HomepageAnnouncementsTitleColor: "#0369a1", HomepageThingsTitleColor: "#0369a1", HomepageCleanersBoxBg: "#075985", HomepageCleanersTextColor: "#bae6fd",
    HomepageBirthdayCardBg: "#f0f9ff", HomepageBirthdayCardAccent: "#0284c7", HomepageBirthdayDateBg: "#075985", HomepageBirthdayDateTextColor: "#bae6fd", HomepageBirthdayInnerBg: "#0369a1"
  }),
  buildHomepagePreset("forest", "Forest Green", "nature", "Natural green theme with calm earthy details.", ["#dcfce7", "#166534", "#052e16", "#fefce8"], {
    HomepageBgColor: "#dcfce7", HomepageCardBgColor: "#fefce8", HomepageCardBorderColor: "#166534", HomepageTopbarBg: "#052e16", HomepageBrandSubtitleColor: "#bbf7d0", HomepageAccentColor: "#22c55e", HomepageAccentTextColor: "#052e16",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#14532d", HomepageCurrentLabelColor: "#bbf7d0", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0fdf4",
    HomepageScheduleTitleColor: "#166534", HomepageAnnouncementsTitleColor: "#166534", HomepageThingsTitleColor: "#166534", HomepageCleanersBoxBg: "#052e16", HomepageCleanersTextColor: "#bbf7d0",
    HomepageBirthdayCardBg: "#fefce8", HomepageBirthdayCardAccent: "#22c55e", HomepageBirthdayInnerBg: "#14532d", HomepageBirthdayGreetingColor: "#bbf7d0"
  }),
  buildHomepagePreset("mint", "Mint Fresh", "nature", "Fresh mint and teal theme, clean but playful.", ["#ccfbf1", "#0f766e", "#134e4a", "#ffffff"], {
    HomepageBgColor: "#ccfbf1", HomepageCardBorderColor: "#5eead4", HomepageTopbarBg: "#134e4a", HomepageBrandSubtitleColor: "#99f6e4", HomepageAccentColor: "#14b8a6", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f766e", HomepageCurrentLabelColor: "#ccfbf1", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f0fdfa",
    HomepageScheduleTitleColor: "#0f766e", HomepageAnnouncementsTitleColor: "#0f766e", HomepageThingsTitleColor: "#0f766e", HomepageCleanersBoxBg: "#134e4a", HomepageCleanersTextColor: "#99f6e4",
    HomepageBirthdayCardAccent: "#14b8a6", HomepageBirthdayDateBg: "#134e4a", HomepageBirthdayDateTextColor: "#99f6e4", HomepageBirthdayInnerBg: "#0f766e"
  }),
  buildHomepagePreset("sunset", "Sunset Orange", "fun", "Warm orange, coral, and cream for a lively homepage.", ["#ffedd5", "#f97316", "#9a3412", "#fff7ed"], {
    HomepageBgColor: "#ffedd5", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#fb923c", HomepageTopbarBg: "#9a3412", HomepageBrandSubtitleColor: "#fed7aa", HomepageAccentColor: "#f97316", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#c2410c", HomepageCurrentLabelColor: "#fed7aa", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fff7ed",
    HomepageScheduleTitleColor: "#c2410c", HomepageAnnouncementsTitleColor: "#c2410c", HomepageThingsTitleColor: "#9a3412", HomepageCleanersBoxBg: "#9a3412", HomepageCleanersTextColor: "#fed7aa",
    HomepageBirthdayCardBg: "#fff7ed", HomepageBirthdayCardAccent: "#f97316", HomepageBirthdayInnerBg: "#c2410c", HomepageBirthdayGreetingColor: "#fed7aa"
  }),
  buildHomepagePreset("coral", "Coral Pop", "fun", "Energetic coral theme with bright readable cards.", ["#fff1f2", "#ef4444", "#7f1d1d", "#ffffff"], {
    HomepageBgColor: "#fff1f2", HomepageCardBorderColor: "#fca5a5", HomepageTopbarBg: "#7f1d1d", HomepageAccentColor: "#ef4444", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#b91c1c", HomepageCurrentLabelColor: "#fee2e2", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fee2e2",
    HomepageScheduleTitleColor: "#b91c1c", HomepageAnnouncementsTitleColor: "#b91c1c", HomepageThingsTitleColor: "#991b1b", HomepageCleanersBoxBg: "#7f1d1d", HomepageCleanersTextColor: "#fecaca",
    HomepageBirthdayCardAccent: "#ef4444", HomepageBirthdayDateBg: "#7f1d1d", HomepageBirthdayDateTextColor: "#fecaca", HomepageBirthdayInnerBg: "#991b1b"
  }),
  buildHomepagePreset("royalPurple", "Royal Purple", "premium", "Bold purple with gold accents for a premium look.", ["#2e1065", "#a855f7", "#facc15", "#faf5ff"], {
    HomepageBgColor: "#581c87", HomepageTextColor: "#faf5ff", HomepageCardBgColor: "#faf5ff", HomepageCardTextColor: "#2e1065", HomepageCardBorderColor: "#2e1065", HomepageTopbarBg: "#2e1065", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#2e1065",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#2e1065", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f3e8ff",
    HomepageScheduleTitleColor: "#2e1065", HomepageAnnouncementsTitleColor: "#2e1065", HomepageThingsTitleColor: "#2e1065", HomepageCleanersBoxBg: "#2e1065", HomepageCleanersTextColor: "#facc15",
    HomepageBirthdayCardBg: "#faf5ff", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayDateBg: "#2e1065", HomepageBirthdayInnerBg: "#2e1065", HomepageBirthdayGreetingColor: "#facc15"
  }),
  buildHomepagePreset("dark", "Dark Premium", "premium", "Dark mode with gold accents, best for projector displays.", ["#101014", "#ffd000", "#1d1d24", "#fff8d8"], {
    HomepageBgColor: "#101014", HomepageTextColor: "#fff8d8", HomepageCardBgColor: "#1d1d24", HomepageCardTextColor: "#fff8d8", HomepageCardBorderColor: "#ffd000", HomepageCardShadowColor: "#000000", HomepageTopbarBg: "#000000", HomepageTopbarText: "#fff8d8", HomepageAccentColor: "#ffd000", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#000000", HomepageCurrentLabelColor: "#ffd000", HomepageCurrentSubjectColor: "#fff8d8", HomepageCurrentDetailsColor: "#fff8d8", HomepageNextCardBg: "#1d1d24", HomepageNextLabelColor: "#ffd000", HomepageNextSubjectColor: "#fff8d8", HomepageNextDetailsColor: "#fff8d8",
    HomepageScheduleTitleColor: "#ffd000", HomepageSchedulePanelBg: "#1d1d24", HomepageScheduleCardBg: "#2b2b35", HomepageScheduleCardText: "#fff8d8", HomepageAnnouncementPanelBg: "#1d1d24", HomepageAnnouncementCardBg: "#2b2b35", HomepageAnnouncementTextColor: "#fff8d8", HomepageThingsPanelBg: "#1d1d24", HomepageThingsItemBg: "#2b2b35", HomepageThingsItemText: "#fff8d8",
    HomepagePrayerCardBg: "#1d1d24", HomepagePrayerCardBorder: "#ffd000", HomepagePrayerCardText: "#fff8d8", HomepagePrayerNameColor: "#fff8d8", HomepagePrayerDividerColor: "#ffd000", HomepageCleanersBoxBg: "#000000", HomepageCleanersBorderColor: "#ffd000", HomepageCleanersLabelColor: "#fff8d8", HomepageCleanersTextColor: "#ffd000",
    HomepageBirthdayCardBg: "#1d1d24", HomepageBirthdayCardBorder: "#ffd000", HomepageBirthdayCardAccent: "#ffd000", HomepageBirthdayDateBg: "#000000", HomepageBirthdayDateTextColor: "#ffd000", HomepageBirthdayDateBorder: "#ffd000", HomepageBirthdayInnerBg: "#000000", HomepageBirthdayInnerBorder: "#ffd000", HomepageBirthdayGreetingColor: "#ffd000", HomepageBirthdayCelebrantColor: "#ffffff", HomepageBirthdayMessageColor: "#fff8d8", HomepageBirthdayEmptyBg: "#000000", HomepageBirthdayEmptyText: "#ffd000", HomepageTickerBg: "#000000", HomepageTickerText: "#ffd000"
  }),
  buildHomepagePreset("chalkboard", "Chalkboard", "classic", "Green board classroom style with chalk-like warm text.", ["#052e16", "#166534", "#fef3c7", "#ffffff"], {
    HomepageBgColor: "#14532d", HomepageTextColor: "#fef3c7", HomepageCardBgColor: "#fefce8", HomepageCardTextColor: "#052e16", HomepageCardBorderColor: "#052e16", HomepageTopbarBg: "#052e16", HomepageBrandSubtitleColor: "#fef3c7", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#052e16",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#052e16", HomepageCurrentLabelText: "Now on Board", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#fef3c7", HomepageNextCardBg: "#fefce8",
    HomepageScheduleTitleColor: "#052e16", HomepageAnnouncementsTitleColor: "#052e16", HomepageThingsTitleColor: "#052e16", HomepageCleanersBoxBg: "#052e16", HomepageCleanersTextColor: "#facc15", HomepageBirthdayInnerBg: "#052e16", HomepageBirthdayGreetingColor: "#facc15"
  }),
  buildHomepagePreset("minimal", "Clean Minimal", "modern", "Simple white, black, and gray layout with less visual noise.", ["#f8fafc", "#111827", "#e5e7eb", "#ffffff"], {
    HomepageBgColor: "#f8fafc", HomepageCardBgColor: "#ffffff", HomepageCardTextColor: "#111827", HomepageCardBorderColor: "#d1d5db", HomepageCardShadowColor: "#9ca3af", HomepageAccentColor: "#111827", HomepageAccentTextColor: "#ffffff", HomepageTopbarBg: "#111827", HomepageBrandSubtitleColor: "#d1d5db", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#111827", HomepageCurrentLabelColor: "#d1d5db", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffffff", HomepageNextLabelColor: "#111827",
    HomepageScheduleTitleColor: "#111827", HomepageAnnouncementsTitleColor: "#111827", HomepageThingsTitleColor: "#111827", HomepageCleanersBoxBg: "#111827", HomepageCleanersTextColor: "#ffffff", HomepageBirthdayCardAccent: "#111827", HomepageTickerBg: "#111827", HomepageTickerText: "#ffffff"
  }),
  buildHomepagePreset("creamCafe", "Cream Café", "soft", "Warm cream and coffee colors for calm readable homepage.", ["#fef3c7", "#92400e", "#451a03", "#fff7ed"], {
    HomepageBgColor: "#fef3c7", HomepageCardBgColor: "#fff7ed", HomepageCardBorderColor: "#92400e", HomepageTopbarBg: "#451a03", HomepageBrandSubtitleColor: "#fde68a", HomepageAccentColor: "#d97706", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#78350f", HomepageCurrentLabelColor: "#fde68a", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fff7ed",
    HomepageScheduleTitleColor: "#78350f", HomepageAnnouncementsTitleColor: "#78350f", HomepageThingsTitleColor: "#78350f", HomepageCleanersBoxBg: "#451a03", HomepageCleanersTextColor: "#fde68a", HomepageBirthdayCardAccent: "#d97706", HomepageBirthdayInnerBg: "#78350f", HomepageBirthdayGreetingColor: "#fde68a"
  }),
  buildHomepagePreset("cyber", "Cyber Neon", "premium", "Futuristic dark theme with cyan and neon accents.", ["#020617", "#22d3ee", "#a3e635", "#111827"], {
    HomepageBgColor: "#020617", HomepageTextColor: "#e0f2fe", HomepageCardBgColor: "#0f172a", HomepageCardTextColor: "#e0f2fe", HomepageCardBorderColor: "#22d3ee", HomepageCardShadowColor: "#000000", HomepageTopbarBg: "#020617", HomepageBrandSubtitleColor: "#a3e635", HomepageAccentColor: "#22d3ee", HomepageAccentTextColor: "#020617", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f172a", HomepageCurrentLabelColor: "#22d3ee", HomepageCurrentSubjectColor: "#a3e635", HomepageCurrentDetailsColor: "#e0f2fe", HomepageNextCardBg: "#111827", HomepageNextSubjectColor: "#e0f2fe", HomepageNextLabelColor: "#22d3ee",
    HomepageScheduleTitleColor: "#22d3ee", HomepageAnnouncementsTitleColor: "#22d3ee", HomepageThingsTitleColor: "#a3e635", HomepageCleanersBoxBg: "#020617", HomepageCleanersBorderColor: "#22d3ee", HomepageCleanersTextColor: "#a3e635", HomepageBirthdayInnerBg: "#020617", HomepageBirthdayGreetingColor: "#22d3ee", HomepageBirthdayCelebrantColor: "#a3e635", HomepageTickerBg: "#020617", HomepageTickerText: "#22d3ee"
  }),
  buildHomepagePreset("ice", "Ice Crystal", "modern", "Cool icy blue theme with crisp white cards.", ["#ecfeff", "#67e8f9", "#155e75", "#ffffff"], {
    HomepageBgColor: "#ecfeff", HomepageCardBorderColor: "#67e8f9", HomepageTopbarBg: "#155e75", HomepageBrandSubtitleColor: "#cffafe", HomepageAccentColor: "#06b6d4", HomepageAccentTextColor: "#ffffff", HomepageShadowStyle: "soft",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#155e75", HomepageCurrentLabelColor: "#cffafe", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#ffffff",
    HomepageScheduleTitleColor: "#155e75", HomepageAnnouncementsTitleColor: "#155e75", HomepageThingsTitleColor: "#155e75", HomepageCleanersBoxBg: "#155e75", HomepageCleanersTextColor: "#cffafe", HomepageBirthdayCardAccent: "#06b6d4", HomepageBirthdayDateBg: "#155e75", HomepageBirthdayInnerBg: "#0e7490"
  }),
  buildHomepagePreset("rainbowSoft", "Rainbow Soft", "fun", "Colorful but still readable classroom display theme.", ["#fde68a", "#f472b6", "#60a5fa", "#34d399"], {
    HomepageBgColor: "#fef9c3", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#f472b6", HomepageTopbarBg: "#111827", HomepageBrandSubtitleColor: "#fde68a", HomepageAccentColor: "#60a5fa", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#f472b6", HomepageCurrentLabelColor: "#ffffff", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#dbeafe", HomepageNextLabelColor: "#2563eb",
    HomepageScheduleTitleColor: "#2563eb", HomepageAnnouncementsTitleColor: "#db2777", HomepageThingsTitleColor: "#059669", HomepageCleanersBoxBg: "#111827", HomepageCleanersTextColor: "#fde68a", HomepageBirthdayCardAccent: "#f472b6", HomepageBirthdayDateBg: "#2563eb", HomepageBirthdayInnerBg: "#db2777"
  }),
  buildHomepagePreset("graphite", "Graphite Gray", "premium", "Dark gray professional theme with yellow highlights.", ["#18181b", "#3f3f46", "#facc15", "#f4f4f5"], {
    HomepageBgColor: "#27272a", HomepageTextColor: "#f4f4f5", HomepageCardBgColor: "#f4f4f5", HomepageCardTextColor: "#18181b", HomepageCardBorderColor: "#18181b", HomepageTopbarBg: "#18181b", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#18181b",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#18181b", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#e4e4e7",
    HomepageScheduleTitleColor: "#18181b", HomepageAnnouncementsTitleColor: "#18181b", HomepageThingsTitleColor: "#18181b", HomepageCleanersBoxBg: "#18181b", HomepageCleanersTextColor: "#facc15", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayInnerBg: "#18181b"
  }),
  buildHomepagePreset("berry", "Berry Classroom", "fun", "Deep berry and pink for lively but still clean visuals.", ["#fce7f3", "#be185d", "#831843", "#ffffff"], {
    HomepageBgColor: "#fce7f3", HomepageCardBorderColor: "#f9a8d4", HomepageTopbarBg: "#831843", HomepageBrandSubtitleColor: "#fbcfe8", HomepageAccentColor: "#be185d", HomepageAccentTextColor: "#ffffff",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#9d174d", HomepageCurrentLabelColor: "#fbcfe8", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#fdf2f8",
    HomepageScheduleTitleColor: "#9d174d", HomepageAnnouncementsTitleColor: "#be185d", HomepageThingsTitleColor: "#831843", HomepageCleanersBoxBg: "#831843", HomepageCleanersTextColor: "#fbcfe8", HomepageBirthdayCardAccent: "#be185d", HomepageBirthdayInnerBg: "#831843"
  }),
  buildHomepagePreset("lemonade", "Lemonade", "fun", "Bright yellow and fresh green, sunny but readable.", ["#fef9c3", "#84cc16", "#365314", "#ffffff"], {
    HomepageBgColor: "#fef9c3", HomepageCardBorderColor: "#a3e635", HomepageTopbarBg: "#365314", HomepageBrandSubtitleColor: "#fef08a", HomepageAccentColor: "#84cc16", HomepageAccentTextColor: "#111111",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#365314", HomepageCurrentLabelColor: "#fef08a", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#f7fee7",
    HomepageScheduleTitleColor: "#365314", HomepageAnnouncementsTitleColor: "#4d7c0f", HomepageThingsTitleColor: "#365314", HomepageCleanersBoxBg: "#365314", HomepageCleanersTextColor: "#fef08a", HomepageBirthdayCardAccent: "#84cc16", HomepageBirthdayDateBg: "#365314", HomepageBirthdayInnerBg: "#4d7c0f"
  }),
  buildHomepagePreset("navy", "Navy Academy", "classic", "Formal navy and gold, clean for school announcements.", ["#0f172a", "#facc15", "#dbeafe", "#ffffff"], {
    HomepageBgColor: "#dbeafe", HomepageTextColor: "#0f172a", HomepageCardBgColor: "#ffffff", HomepageCardBorderColor: "#0f172a", HomepageTopbarBg: "#0f172a", HomepageBrandSubtitleColor: "#facc15", HomepageAccentColor: "#facc15", HomepageAccentTextColor: "#0f172a",
    HomepageUseSubjectPeriodColors: "NO", HomepageCurrentCardBg: "#0f172a", HomepageCurrentLabelColor: "#facc15", HomepageCurrentSubjectColor: "#ffffff", HomepageNextCardBg: "#eff6ff",
    HomepageScheduleTitleColor: "#0f172a", HomepageAnnouncementsTitleColor: "#0f172a", HomepageThingsTitleColor: "#0f172a", HomepageCleanersBoxBg: "#0f172a", HomepageCleanersTextColor: "#facc15", HomepageBirthdayCardAccent: "#facc15", HomepageBirthdayInnerBg: "#0f172a"
  })
];

function getHomepageThemePreset(name) {
  return getAllHomepageThemePresets().find(preset => preset.id === name) || HOMEPAGE_THEME_PRESETS[0];
}

function applyHomepageDesignPreset(name) {
  const preset = getHomepageThemePreset(name);
  fillHomepageDesignForm(preset.settings || HOMEPAGE_DESIGN_DEFAULTS);
  homepagePreviewPresetId = preset.id;
  const status = document.getElementById("homepageDesignStatus");
  if (status) status.textContent = `${preset.name} is previewed. Click Pick + Save to publish it.`;
  renderHomepagePresetGallery();
}

async function applyAndSaveHomepageDesignPreset(name) {
  const preset = getHomepageThemePreset(name);
  fillHomepageDesignForm(preset.settings || HOMEPAGE_DESIGN_DEFAULTS);
  homepagePreviewPresetId = "";
  setHomepageActivePresetId(preset.id);
  await saveHomepageDesignSettings();
  renderHomepagePresetGallery();
}


function toggleHomepageDesignGroups() {
  const groups = Array.from(document.querySelectorAll(".homepageDesignStudio .manualDesignControls .designGroup"));
  if (!groups.length) return;
  const shouldOpen = groups.some(group => !group.open);
  groups.forEach(group => {
    group.open = shouldOpen;
  });
}

function scrollHomepageStudioSection(targetId) {
  const target = document.getElementById(targetId) || document.querySelector(`.${targetId}`);
  if (!target) return;
  target.scrollIntoView({ behavior: "smooth", block: "start" });
}

function renderHomepagePresetGallery() {
  const gallery = document.getElementById("homepagePresetGallery");
  if (!gallery) return;

  const searchInput = document.getElementById("homepagePresetSearch");
  const categorySelect = document.getElementById("homepagePresetCategory");

  if (!gallery.dataset.bound) {
    searchInput?.addEventListener("input", renderHomepagePresetGallery);
    categorySelect?.addEventListener("change", renderHomepagePresetGallery);
    gallery.dataset.bound = "true";
  }

  const query = String(searchInput?.value || "").trim().toLowerCase();
  const category = String(categorySelect?.value || "all");
  const activePresetId = getHomepageActivePresetId();

  const allPresets = getAllHomepageThemePresets();
  const filtered = allPresets.filter((preset) => {
    const matchesCategory = category === "all" || preset.category === category;
    const haystack = `${preset.name} ${preset.category} ${preset.description}`.toLowerCase();
    const matchesSearch = !query || haystack.includes(query);
    return matchesCategory && matchesSearch;
  });

  gallery.className = "themePresetGallery themePresetGalleryV107";

  if (!filtered.length) {
    gallery.innerHTML = `<div class="presetEmptyV107"><strong>No preset found.</strong><span>Try All themes or save your current design as a custom preset.</span></div>`;
    return;
  }

  gallery.innerHTML = filtered.map((preset) => {
    const settings = preset.settings || {};
    const bg = escapeAdminText(settings.HomepageBgColor || "#f7c600");
    const top = escapeAdminText(settings.HomepageTopbarBg || "#111111");
    const card = escapeAdminText(settings.HomepageCardBgColor || "#ffffff");
    const accent = escapeAdminText(settings.HomepageAccentColor || "#ffd000");
    const border = escapeAdminText(settings.HomepageCardBorderColor || "#111111");
    const text = escapeAdminText(settings.HomepageTextColor || "#111111");
    const name = escapeAdminText(preset.name);
    const desc = escapeAdminText(preset.description);
    const id = escapeAdminText(preset.id);
    const categoryText = preset.custom ? "custom" : escapeAdminText(preset.category);
    const isActive = activePresetId === preset.id;
    const isPreview = !isActive && homepagePreviewPresetId === preset.id;
    const statePill = isActive
      ? `<span class="presetStateV107 active">✓ Selected</span>`
      : (isPreview ? `<span class="presetStateV107 preview">👁 Previewing</span>` : `<span class="presetStateV107">Ready</span>`);
    const swatches = (preset.swatches || [bg, top, card, accent]).slice(0, 6).map(color => `<span class="presetSwatchV107" style="background:${escapeAdminText(color)}"></span>`).join("");
    const cardClasses = ["presetCardV107", isActive ? "isActive" : "", isPreview ? "isPreview" : "", preset.custom ? "isCustom" : ""].filter(Boolean).join(" ");

    return `
      <article class="${cardClasses}" style="--p-bg:${bg};--p-top:${top};--p-card:${card};--p-accent:${accent};--p-border:${border};--p-text:${text};">
        <button type="button" class="presetPreviewV107" onclick="applyHomepageDesignPreset('${id}')" aria-label="Preview ${name}">
          <span class="presetMiniHeaderV107"></span>
          <span class="presetMiniClockV107"></span>
          <span class="presetMiniMainV107"></span>
          <span class="presetMiniSideV107"></span>
          <span class="presetMiniFooterV107"></span>
        </button>
        <div class="presetInfoV107">
          <div class="presetTopLineV107">
            <span class="presetBadgeV107 ${preset.custom ? "isCustom" : ""}">${categoryText}</span>
            ${statePill}
          </div>
          <strong>${name}</strong>
          <p>${desc}</p>
          <div class="presetSwatchesV107" aria-hidden="true">${swatches}</div>
        </div>
        <div class="presetActionsV107">
          <button type="button" class="presetPickSaveV107" onclick="applyAndSaveHomepageDesignPreset('${id}')">${isActive ? "✓ Saved" : "Pick + Save"}</button>
          <button type="button" class="presetPreviewBtnV107" onclick="applyHomepageDesignPreset('${id}')">Preview</button>
          ${preset.custom ? `<button type="button" class="presetDeleteV107" onclick="deleteCustomHomepagePreset('${id}')">Delete</button>` : ""}
        </div>
      </article>`;
  }).join("");
}
// v79 preset gallery marker

// v75 preset gallery marker

// v77 homepage design studio UX marker
