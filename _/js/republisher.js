function redirectErr(urlOrEvent) {
    var url = "";
    if(typeof(urlOrEvent) === "string") {
        url = urlOrEvent;
    } else {
        url = urlOrEvent.currentTarget.getAttribute("data-url");
    }
    var confirmed;
    if(hasPost()) {
        var domain = new URL(url).hostname;
        if(!confirm(`This action requires that you authorize through ${domain}, which could cause your current inputs to be lost\nDo you still wish to proceed?`)) {
            return;
        }
    }
    console.log("Data:", url);
    window.location.href = url;
}