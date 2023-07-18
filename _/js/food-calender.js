var calendar = null;
function init() {
    var calendarEl = document.getElementById('calendar');
    calendar = new FullCalendar.Calendar(calendarEl, {
        schedulerLicenseKey: 'CC-Attribution-NonCommercial-NoDerivatives',
        headerToolbar: {
            center: "dayGridWeek,dayGridMonth"
        },
        initialView: 'dayGridMonth',
        firstDay: 1,
        allDaySlot: false,
        events: {
            url: "/api/food/calendar"
        },
        editable: false,
        height: "auto",
        initialDate: !!window.location.hash ? new Date(window.location.hash) : undefined,
        nowIndicator: true,
        eventContent: injectContent,
        eventColor: 'black'
    });
    calendar.render();

    var prevButton = document.getElementsByClassName("fc-prev-button")[0];
    var nextButton = document.getElementsByClassName("fc-next-button")[0];
    prevButton.addEventListener("click", dateChanged);
    nextButton.addEventListener("click", dateChanged);
}
function pad(number) {
    return number.toString().padStart(2, "0");
}
function dateChanged(arg) {
    var first = calendar.view.currentStart;
    var date = first.getFullYear() + "-" + pad(first.getMonth() + 1) + "-" + pad(first.getDate());
    window.location.hash = date;
}
function sentenceCase(str) {
    items = str.split("-");
    b = "";
    for(let x of items) {
        b += x.substring(0, 1).toUpperCase() + x.substring(1);
        b += " "
    }
    return b;
}

function injectContent(arg) {
    var items = [];
    var event = arg.event;
    var props = event.extendedProps;


    if(props.manu) {
        var manuf = document.createElement("span");
        manuf.innerText = props.manu;
        manuf.className = "badge";
        items.push(manuf);
    }
    var title = document.createElement("div");
    title.className = "fc-event-title fc-sticky";
    title.innerText = event.title;
    items.push(title);

    if(props.tags) {
        items.push(document.createElement("br"));
        for(let tag of props.tags) {
            var tg = document.createElement("span");
            tg.innerText = sentenceCase(tag);
            tg.className = "badge";
            tg.style.color = "black";
            tg.style.backgroundColor = "red";
            items.push(tg);
        }
    }

    if(props.frozen) {
        items.push(document.createElement("br"));
        let fr = document.createElement("img");
        fr.src = "/_/img/snowflake.png"
        fr.style.width = "32px";
        items.push(fr);
    }
    return {domNodes: items};
}
document.addEventListener('DOMContentLoaded', function() {
    init();
});