var main = function() {
	$("#hide").click(function() {
		$("#content").hide();
	});
	
	$("#show").click(function(){
		$("#content").show();
	});

	$("#move").click(function() {
		if($("#content").css("left") == "0px") {
			$("#content").animate({
				left: "50px"
			}, 200);
			console.log("moving to 50");
		} else {
			$("#content").animate({
				left: "0px"
			}, 200);
			console.log("moving to 0");
		}
	});
}

$(document).ready(main);