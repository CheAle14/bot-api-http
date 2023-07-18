function selectChange(event) {
    var select = event.currentTarget;
    console.log(select, select.value);
    var input = document.getElementById(select.id.replace("select", ""));
    var value = select.value;
    if(value === "other") {
        input.toggleAttribute("readonly", false);
        input.value = "";
    } else {
        input.toggleAttribute("readonly", true);
        input.value = value;
    }
}
document.body.onload = function() {
    const today = new Date();
    const yyyy = today.getFullYear();
    let mm = today.getMonth() + 1; // Months start at 0!
    let dd = today.getDate();

    if (dd < 10) dd = '0' + dd;
    if (mm < 10) mm = '0' + mm;

    const formattedToday = yyyy + '-' + mm + '-' + dd;
    document.getElementById("date").value = formattedToday;
    for(var select of document.getElementsByTagName("select")) {
        select.onchange = selectChange;
    }
}