/**
 *  Page 1 takes in user input
 */
// send data to next page
function sendData() {
    var origin = $( 'input[id=origin]').val();
    var destination = $( 'input[id=destination]').val();

    var packedData = origin+","+destination;

    window.location.replace("page2.html?" + packedData);
}