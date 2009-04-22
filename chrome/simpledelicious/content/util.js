/**
 * @author jonathan
 */
var Util ={
	log:null,
	debug:0,
	funcMaps:null,
	 
	
	addDelay:function(id, fname, delay){
		if(Util.funcMaps==null)Util.funcMaps=new Array();
		if(Util.funcMaps[id]==null)Util.funcMaps[id]=new Array();
		if(Util.funcMaps[id][fname]==null)Util.funcMaps[id][fname]=new Array();
		Util.funcMaps[id][fname]['delay']=delay;
		Util.funcMaps[id][fname]['lastTime']=0;
		

	},
	testtest:function(event){
		alert("testtest ");
	},
	findFuncInMap:function(array, name){
		
		for(var i=0;i<array.length;i++){
			
			if(isObject(array[i][name]))return i;
		}
		return -1;
	},
	callFunc:function(obj,callback){
		
		if(Util.funcMaps==null ){
			
			Util.callFuncHelper(arguments);
			return 1;
		}
		
		var index=Util.findFuncInMap(Util.funcMaps, callback);
		
		if( index<0 || !Util.isNumeric(Util.funcMaps[index][callback]['lastTime'])){
			
			Util.callFuncHelper(arguments);
			return 1;
		}
		
		var now=new Date();
		if(now.getTime()-Util.funcMaps[index][callback]['lastTime'] >= Util.funcMaps[index][callback]['delay']){
		
			
			//alert(now.getTime()+","+Util.funcMaps[index][callback]['lastTime']);
			//alert("diff is "+(now.getTime()-Util.funcMaps[index][callback]['lastTime']));
			Util.callFuncHelper(arguments);
			return 1;
		} 
		//alert(now.getTime()+","+Util.funcMaps[callback]['lastTime']);
		
		var s="";
		for(var i=2;i<arguments.length;i++){
			s=s+"'"+arguments[i]+"'";
			if(i<arguments.length-1){
				s=s+",";
			}
		}
		if(obj!=null){
			obj=obj+".";
			
		}
		else obj="";
		var evalStr=obj+callback+"("+s+")";
		setTimeout(evalStr,100);
		
		return 0;
		

	},
	
	callFuncHelper:function(){
		
		
		//for(var k=0;k<arguments.length;k++){alert(arguments[k]);}
		//alert("callee is "+arguments.callee);
		
		var obj=arguments[0][0];
		var callback=arguments[0][1];
		
		
		var s="";
		for(var i=2;i<arguments[0].length;i++){
			s=s+"'"+arguments[0][i]+"'";
			if(i<arguments[0].length-1){
				s=s+",";
			}
		}
		if(obj!=null){
			obj=obj+".";
			
		}
		else obj="";
		var evalStr=obj+callback+"("+s+")";
		
		eval(evalStr);
		
		if(Util.funcMaps==null){
			Util.funcMaps=new Array();
			
		}		
		var now=new Date().getTime();
		var index=Util.findFuncInMap(Util.funcMaps, callback);
		//alert("index is "+index);
		//alert(Util.funcMaps[index]);
		for(var i in Util.funcMaps[index]){
			Util.funcMaps[index][i]['lastTime']=now;
			//alert("func is "+Util.funcMaps[index][i]);
		}
	},
	isNumeric:function (sText)

{
   var ValidChars = "0123456789.";
   var IsNumber=true;
   var Char;

 
   for (i = 0; i < sText.length && IsNumber == true; i++) 
      { 
      Char = sText.charAt(i); 
      if (ValidChars.indexOf(Char) == -1) 
         {
         IsNumber = false;
         }
      }
   return IsNumber;
   },
	inspect:function(el){
		for(var i in el){
			Util.log(el[i]);
		}
	},
	sortString:function(a, b){
		a=a.toLowerCase();
		b=b.toLowerCase();
		if(a<b)return -1;
		if(a>b)return 1;
		return 0;
	},
	contains:function(array, el){
		for(var i=0;i<array.length;i++){
			if(array[i] == el){
				return true;
			}
		}
		return false;
	},
	remove:function(array, el){
		for(var i=0;i<array.length;i++){
			if(array[i]==el){
				array.splice(i,1);
			}
		}
	},
	isEmpty:function(str){
		
		return str==null || Util.trim(str)=='';
	},
	log:function(message, force) {
		if(!Util.debug && !force)return;
		var log=Util.log;
		if(!log)log=new Array();
    	if (!log.window_ || log.window_.closed) {
        	var win = window.open("", null, "width=400,height=200," +
                              "scrollbars=yes,resizable=yes,status=no," +
                              "location=no,menubar=no,toolbar=no");
        	if (!win) return;
        	var doc = win.document;
        	doc.write("<html><head><title>Debug Log</title></head>" +
                  "<body></body></html>");
        	doc.close();
        	log.window_ = win;
    	}
    	var logLine = log.window_.document.createElement("div");
    	logLine.appendChild(log.window_.document.createTextNode(message));
    	log.window_.document.body.appendChild(logLine);
	},
	
	
	leftTrim: function (sString)
	{
		while (sString.substring(0,1) == ' ')
		{
			sString = sString.substring(1, sString.length);
		}
		return sString;
	},


 	rightTrim:function(sString)
	{
		while (sString.substring(sString.length-1, sString.length) == ' ')
		{
			sString = sString.substring(0,sString.length-1);
		}
		return sString;
	},


	trim: function (sString)
	{
	
		if(sString=='')return '';
		while (sString.substring(0,1) == ' ')
		{
			sString = sString.substring(1, sString.length);
		}
		while (sString.substring(sString.length-1, sString.length) == ' ')
		{
			sString = sString.substring(0,sString.length-1);
		}
		return sString;	
	},
	removeChildren:function(element){
		while (element.firstChild) {
 			 element.removeChild(element.firstChild);
		}

	},
	indexOfByNodeId:function(nodes, id){
		
		if(nodes==null || id==null)return -1;
		for(var i=0;i<nodes.length;i++){
			if(nodes[i].id == id){
				return i;
			}
		}
		return -1;
	},
	
	// from: http://blog.quicksurf.com/index.php?p=78
	base64:function (inp)
{
	var keyStr = "ABCDEFGHIJKLMNOPQRSTUVWXYZ" + //all caps
	"abcdefghijklmnopqrstuvwxyz" + //all lowercase
	"0123456789+/="; // all numbers plus +/=
	var out = ""; //This is the output
	var chr1, chr2, chr3 = ""; //These are the 3 bytes to be encoded
	var enc1, enc2, enc3, enc4 = ""; //These are the 4 encoded bytes
	var i = 0; //Position counter
	
	do { //Set up the loop here
		chr1 = inp.charCodeAt(i++); //Grab the first byte
		chr2 = inp.charCodeAt(i++); //Grab the second byte
		chr3 = inp.charCodeAt(i++); //Grab the third byte
		
		//Here is the actual base64 encode part.
		//There really is only one way to do it.
		enc1 = chr1 >> 2;
		enc2 = ((chr1 & 3) << 4) | (chr2 >> 4);
		enc3 = ((chr2 & 15) << 2) | (chr3 >> 6);
		enc4 = chr3 & 63;
		
		if (isNaN(chr2)) {
			enc3 = enc4 = 64;
		} else if (isNaN(chr3)) {
			enc4 = 64;
		}
		
		//Lets spit out the 4 encoded bytes
		out = out + keyStr.charAt(enc1) + keyStr.charAt(enc2) + keyStr.charAt(enc3) +
		keyStr.charAt(enc4);
		
		// OK, now clean out the variables used.
		chr1 = chr2 = chr3 = "";
		enc1 = enc2 = enc3 = enc4 = "";
	
	} while (i < inp.length); //And finish off the loop
	
	//Now return the encoded values.
	return out;
},
	inspect: function(el){
			for(var i in el){
				Util.log(el[i].name);
			}
	},
  nsArrayToJs: function(nsArray) {
    var result = [];
    nsArray.QueryInterface(Components.interfaces.nsIArray);
    var nsEnum = nsArray.enumerate();
    while (nsEnum.hasMoreElements()) {
      var e = nsEnum.getNext();
      e.QueryInterface(Components.interfaces.nsISupportsString);
      result.push(e.data);
    }
    return result;
  },
  purge:function(d) {
    var a = d.attributes, i, l, n;
    if (a) {
        l = a.length;
        for (i = 0; i < l; i += 1) {
            n = a[i].name;
            if (typeof d[n] === 'function') {
                d[n] = null;
            }
        }
    }
    a = d.childNodes;
    if (a) {
        l = a.length;
        for (i = 0; i < l; i += 1) {
            purge(d.childNodes[i]);
        }
    }
  }

      

       ,dumpObj:function(obj, name, indent, depth, MAX_DUMP_DEPTH) {

              if (depth > MAX_DUMP_DEPTH) {

                     return indent + name + ": Maximum Depth Reached<br>";

              }

              if (typeof obj == "object") {

                     var child = null;

                     var output = indent + name + "\n";

                     indent += "\t";

                     for (var item in obj)

                     {

                           try {

                                  child = obj[item];

                           } catch (e) {

                                  child = "Unable to Evaluate";

                           }

                           if (typeof child == "object") {

                                  output += Util.dumpObj(child, item, indent, depth + 1, MAX_DUMP_DEPTH);

                           } else {

                                  output += indent + item + ": " + child + "\n";

                           }

                     }

                     return output;

              } else {

                     return obj;

              }

       }  
  
}