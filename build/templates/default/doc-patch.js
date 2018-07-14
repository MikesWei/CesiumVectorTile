
var fs = require("fs");
var path = require("path");
module.exports=function(indexUrl){ 
	var txt = fs.readFileSync(indexUrl, "utf-8");
	var start = txt.indexOf(`<link type="text/css" rel="stylesheet" href="styles/jsdoc-default.css">`);
	var end = txt.indexOf("<nav>");
	var start2 = txt.indexOf("</nav>");

	var part1 = `
		<link type="text/css" rel="stylesheet" href="styles/jsdoc-index.css">
		<style type="text/css">
	   #mainIndex h3 {
		display: block;
	}
	  #mainIndex   h5 a:link,#mainIndex   h5  a:active, #mainIndex   h5 a:visited{
			color:black;
	}
		</style>
	</head>

	<body>
		<div id="mainIndex">
			<div class="nav">`;

	txt = txt.replace(txt.slice(start, end + "<nav>".length), part1);
	var part2 = `  </div>
		</div>`;

	txt = txt.replace("</nav>", part2);
	fs.writeFileSync(indexUrl, txt, "utf-8");
}