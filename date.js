// jshint esversion:6

exports.getDate = function () {
    
    let today = new Date();
    
    var options = {
        weekday : "long",
        day : "numeric",
        month: "long",
        year : "numeric"
    };

    return today.toLocaleDateString("en-US", options);
};

