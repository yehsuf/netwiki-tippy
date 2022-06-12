let noTippyForMe;
let stopButton = null;

function init() {
    let storedPreferance = localStorage.getItem('noTippyForMe');
    if (!storedPreferance) {
        noTippyForMe = false;
        localStorage.setItem("noTippyForMe", noTippyForMe);
    }
    noTippyForMe = JSON.parse(localStorage.noTippyForMe);
    stopButton.innerHTML = noTippyForMe ? "הפעל תקציר" : "בטל תקציר";
}

function tippyStopButton() {
    stopButton = document.getElementById('noTippy');
    if (stopButton) {
        stopButton.addEventListener("click", () => {
            noTippyForMe = JSON.parse(localStorage.noTippyForMe);
            noTippyForMe = !noTippyForMe;
            stopButton.innerHTML = noTippyForMe ? "הפעל תקציר" : "בטל תקציר";
            localStorage.setItem("noTippyForMe", noTippyForMe);
        })
    }
}

if (document.readyState === 'complete') {
    tippyStopButton();
} else {
    document.addEventListener('DOMContentLoaded', (event) => {
        tippyStopButton();
    })
}

window.tippyInstances = [];

function isDarkMode() {
    if (window.matchMedia) {
        if (window.matchMedia('(prefers-color-scheme: dark)').matches) {
            return 'dark';
        } else {
            return 'light';
        }
    }
    return;
}

function setColorScheme() {
    mode = isDarkMode();
    switch (mode) {
        case 'dark':
            theme = "material"
            break;
        case 'light':
            theme = "light"
            break;
        default:
            theme = "light"
            break;
    }
}

function checkModeChange() {
    if (window.matchMedia) {
        let colorSchemeQuery = window.matchMedia('(prefers-color-scheme: dark)');
        colorSchemeQuery.addEventListener('change', setColorScheme);
    }
}

function tippyDeleteAll() {
    tippyInstances.forEach(instance => {
        instance.destroy();
    });
    tippyInstances.length = 0;
}

function tippyHideAll() {
    tippyInstances.forEach(instance => {
        instance.hide();
    });
}

async function addPreview() {
    let currentLink = this;
    noTippyForMe = JSON.parse(localStorage.noTippyForMe);
    if (noTippyForMe) {
        tippyDeleteAll()
        return;
    }
    let content;
    let wikiPage = currentLink.href.split("mywikidomain.com/wiki/")[1];
    if (!wikiPage) {
        console.warn(currentLink.href);
        return;
    }
    if (wikiPage.match(/(?<!^%D7%9E%D7%A9%D7%AA%D7%9E%D7%A9):|\?/)) return; // מבטל הפעלת הפונקציה לעמודים שאינם במרחב ערכים תומך
    if (wikiPage.match(/%D7%A2%D7%9E%D7%95%D7%93_%D7%A8%D7%90%D7%A9%D7%99/)) return; // מבטל טעינת תקציר של עמוד ראשי מכל עמוד
    if (currentLink.getAttribute('href') == document.location.pathname) return; // מבטל טעינת תקציר שמפנה לאותו עמוד

    currentLink.setAttribute('data-title', currentLink.title);
    currentLink.title = ''; //remove html title

    try {
        let res = await fetch(`https://mywikidomain.com/wiki/api.php?action=parse&prop=text&formatversion=2&format=json&page=${wikiPage}`);
        let json = await res.json();
        content = await json.parse.text;
    } catch (error) {
        console.warn(`https://mywikidomain.com/wiki/${wikiPage}`);
        return;
    }

    var words = content.split(" ");
    if (words.length > 60) {
        content = words.splice(0, 60).join(" ").replace(/,\s*$/, "") + '...</div>'
    }


    if (!content.match(/output">\n<\!--/)) {
        const instances = tippy(currentLink, {
            content: `<div style='padding:5px; max-height:400px; max-width:350px; overflow: hidden;'>${content}</div>`,
            showOnCreate: true,
            allowHTML: true,
            duration: 0,
            arrow: true,
            animation: 'shift-toward',
            maxWidth: '300px',
            delay: [300, 80],
            theme: theme,
            interactive: true,
            zIndex: 9999,
            placement: 'top-end',
            appendTo: () => document.body,
        })
        await tippyHideAll();
        window.tippyInstances = tippyInstances.concat(instances);
    }
    //return html title if there is no tippy
    else {
        currentLink.setAttribute('title', currentLink.getAttribute('data-title'));
    }
};

init();
setColorScheme();
checkModeChange();

document.querySelectorAll('a[href^="/"]').forEach(link => {
    link.addEventListener('pointerenter', addPreview);
    link.addEventListener('focus', addPreview);
})

if (tippy = "undefined") {
    mw.loader.load('/support/wiki/index.php?title=מדיה_ויקי:Tippy.js&action=raw&ctype=text/javascript')
}

$('body').mouseleave(function() {
    tippy.hideAll();
});