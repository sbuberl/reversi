
var localStorageAvailable = ('localStorage' in window);

function Settings (difficulty, colorChoice, showHints) {
    this.difficulty = difficulty;
    this.colorChoice = colorChoice;
    this.showHints = showHints;
}

Settings.defaults = new Settings("easy", "random", true);
Settings.current = Settings.defaults;
Settings.localStorageAvailable = ('localStorage' in window);

Settings.prototype.clone = function() {
    return new Settings(this.difficulty, this.colorChoice, this.showHints);
};

var loadSettings = function() {
    if(Settings.localStorageAvailable) {
        var difficulty = localStorage.getItem("difficulty");
        var color = localStorage.getItem("color");
        var showHints = localStorage.getItem("showHints");
        if(!difficulty) {
            difficulty = Settings.current.difficulty;   
        }
        
        if(!color) {
            color = Settings.current.color;
        }
        
        if(showHints) {
            showHints = showHints === "true";
        } else {
            showHints = Settings.current.showHints;
        }
        
        document.forms.settings.difficulty.value = difficulty;
        document.forms.settings.color_choice.value = color;
        document.getElementById('show_hints').checked = showHints;
        
        Settings.current = new Settings(difficulty, color, showHints);
    }
};

var saveSettings = function(e) {
    e.preventDefault();
    var difficulty = document.querySelector('input[name = "difficulty"]:checked').value;
    var color = document.querySelector('input[name = "color_choice"]:checked').value;
    var showHints = document.getElementById('show_hints').checked;
    if(Settings.localStorageAvailable) {
        localStorage.setItem("difficulty", difficulty);
        localStorage.setItem("color", color);
        localStorage.setItem("showHints", showHints ? "true" : "false");
        Settings.current = new Settings(difficulty, color, showHints);
    }
    location.hash = "#game";
};

var resetSettings = function(e) {
    e.preventDefault();
    Settings.current = Settings.defaults;
    loadSettings();
    location.hash = "#game";
};

loadSettings();
document.forms.settings.addEventListener("submit", saveSettings, false);
document.forms.settings.addEventListener("reset", resetSettings, false);
