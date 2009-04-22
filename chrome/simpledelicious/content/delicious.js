
function defined(obj){
	return obj!=false && obj!=undefined && obj!=null;
}
function copy_obj(obj){
	var r={};
	for(var i in obj)r.i=obj.i;
	return r;
}
var sdeliciousMain = {   
	DELETE_API : 'https://api.del.icio.us/v1/posts/delete',
	UPDATE_API : 'https://api.del.icio.us/v1/posts/update',
	ALL_API : 'https://api.del.icio.us/v1/posts/all',
	user : null,
   	showTmpEngine : false,  
   	posts : null,
  	tags:null,
  	lastRetrieveTime:null,
  	bookMarkListener:null,
  	tagsLoading:false,
  	tagsLoadingProgressId:null,
   	addBookmarkMenuItem:null,
	needRefresh:0,
	loginManager:false,
	
	getAllAPIs:function(){
		return [sdeliciousMain.UPDATE_API, sdeliciousMain.ALL_API, sdeliciousMain.DELETE_API];
	},
	addKeyListeners: function(){
                
		var menu=document.getElementById("simple_delicious-menu");
		window.addEventListener('keypress',function(evt){
                                if(menu.getAttribute('open')){
                                      active=sdeliciousMain.findActiveMenuItem();
                                      if(defined(active)){
                                        var peers=active.parentNode.childNodes;
                                        for(var i=0;i<peers.length;i++){
                                                if(peers.item(i).getAttribute('label').charCodeAt(0)==evt.charCode){
                                                        alert('find '+peers.item(i).getAttribute('label'));
                                                        break;
                                                }
                                        }
                                      }
                                      
                                }
			},
			true);
				
		
	},
        findActiveMenuItem:function(){
                //popup.getElementsByAttribute('selected', 'true');
                var menu=document.getElementById("dpopup");
                return menu.firstChild;
        },
  	bookmarkClicked : function(event){
		
		if(event.target.localName == "menuitem"){
			if(event.button==0){ 	
				//sdeliciousMain.UIloadURL(event, event.target.label, 1);
				
				sdeliciousMain.handleCmdOpenMain(event.target.getAttribute('value'), false);
				
			}
			else if(event.button==1){
				sdeliciousMain.handleCmdOpenMain(event.target.getAttribute('value'), true);
				/*
				Util.log("hi "+event.target.nodeName);
				var x=document.getElementById("clipmenu");
				Util.log("clip is "+x.nodeName);
				x.showPopup(event.target,0,0,"bottom","left");
				Util.log("done");
				*/
			}
			
		}		
   },

   handleCmdOpenMain:function(url, new_holder){

	if(new_holder==1){
		 sdeliciousMain.openURLTab(url);
	}
	else if(new_holder==2){
		sdeliciousMain.openURLWindow(url);
	}
	else sdeliciousMain.openURL(url);
	
   	//document.popupNode.parentNode.hidePopup();
	var dpopup=document.getElementById("dpopup");
	dpopup.hidePopup();
   },
   handleCmdOpen:function(event, flag){
   	var popupNode=document.popupNode;
	var url=popupNode.getAttribute("value");
	
   sdeliciousMain.handleCmdOpenMain(url, flag);
		
   },
   patchPref:function(){
	
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.simpleDelicious.");
		prefs.deleteBranch('');
		
   },
   init : function(){
	
     //register progess listener for login status checking
   	
		registerSDeliciousProgressListener();
     //add extra elements to context menu
     //deliciousContextMenu.register();
    
     //apply different style sheet to different platform
     var platform = sdeliciousMain.getPlatform();
     var docStyleSheets =  document.styleSheets; 
     if(platform=="mac" && sdeliciousMain.getAppVersionNum().indexOf("2.") != 0){
         
        for(var i=0; i<docStyleSheets.length; ++i){
            
           if(docStyleSheets[i].href=="chrome://simpledelicious/skin/delicious.css")
              docStyleSheets[i].disabled = true;
           else if(docStyleSheets[i].href=="chrome://simpledelicious/skin/delicious_mac.css")
              docStyleSheets[i].disabled = false;
        }   
     }
     else{
        for(var i=0; i<docStyleSheets.length; ++i){

           if(docStyleSheets[i].href=="chrome://simpledelicious/skin/delicious_mac.css")
              docStyleSheets[i].disabled = true;
	   else if(docStyleSheets[i].href=="chrome://simpledelicious/skin/delicious.css")
              docStyleSheets[i].disabled = false;
        }
        
        if(platform=="unix"){
          document.getElementById("del-key-delicious").setAttribute("modifiers",  "accel");
          document.getElementById("del-key-tagPage").setAttribute("modifiers",  "accel");
        }
     }
      
     //mac would always say engine is not installed
     //as we do not have permission to modify delicious.js
     if(!sdeliciousMain.isEngineInstalled()){
     	sdeliciousMain.installEngine();
     }
     else if(sdeliciousMain.shouldShowTmpEngine()){
        sdeliciousMain.addTmpEngine();
     }
     
	 
     //add observer
	 /*
     var os = Components.classes["@mozilla.org/observer-service;1"]
                                     .getService(Components.interfaces.nsIObserverService);
     os.addObserver(deliciousObserver, "delicious:update-login-status", false);
     os.addObserver(deliciousObserver, "delicious:hide-menu", false);

	 os.addObserver(deliciousObserver,"delicious:update-post",false);	
     //check for the first time start
     sdeliciousMain.firstTimeStart();
	*/
    // setTimeout("sdeliciousMain.delayInit()", 250);
	
	//sdeliciousMain.addKeyListeners();
   },
   
   delayInit : function(){
      
     //set login status
     var user = sdeliciousMain.getUser();

     
     //update the toolbar buttons  
     sdeliciousMain.updateToolbarButtons();
	 
	 //add delay mech to prevent throttle
	 Util.addDelay(0,'updateMenuTags',2000);
	 Util.addDelay(0,'checkMenuTagsUpdate',2000);
	 Util.addDelay(0,'deleteMenuItem',2000);
	 
   },
   
   uninit : function(){
     
     unregisterSDeliciousProgressListener();
     
     
     
     var os = Components.classes["@mozilla.org/observer-service;1"]
                                     .getService(Components.interfaces.nsIObserverService);
     os.removeObserver(deliciousObserver, "delicious:update-login-status");
     os.removeObserver(deliciousObserver, "delicious:hide-menu");
   },

   isMenuHidden : function(){
   
     var pref = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
     try{
       var bool = pref.getBoolPref("delicious.menu.hidden");
       if(bool)
	 return true;
     }
     catch(e){
        pref.setBoolPref("delicious.menu.hidden", false);
     }
   
   return false;
   },
   
   setMenuHiddenInPref : function(){

     var pref = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
     pref.setBoolPref("delicious.menu.hidden", true);
   },
     
   isEngineInstalled : function(){
   
     try{
       var pref = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
       var bool = pref.getBoolPref("delicious.engine.installed");
       if(bool){
	  return true;
       }
     }
     catch(e){}
     
   return false;
   },
   
   installEngine : function(){
	
      var dirService = Components.classes['@mozilla.org/file/directory_service;1']
      			.getService(Components.interfaces.nsIProperties);		
      var srcfile = dirService.get("SrchPlugns", Components.interfaces.nsILocalFile);	
      srcfile.append("delicious.src");

      var prosrcfile = dirService.get("ProfD", Components.interfaces.nsILocalFile);	
      prosrcfile.append("searchplugins");
      prosrcfile.append("delicious.src");
      
      //extract src and graphic if necessary
      if(!srcfile.exists() && !prosrcfile.exists()){

         var jarfile = dirService.get("ProfD", Components.interfaces.nsILocalFile);	
         jarfile.append("extensions");
         jarfile.append("{5a2b4e34-ce62-42e9-a658-06ba4490adf8}");
         jarfile.append("chrome");
         jarfile.append("simpledelicious.jar");
       
         var zipReader = Components.classes["@mozilla.org/libjar/zip-reader;1"] 
	                    .createInstance(Components.interfaces.nsIZipReader); 
         zipReader.init(jarfile); 
         zipReader.open(); 
	    
         var entries = zipReader.findEntries("*.src");
         if(entries){
  	    
  	    var nsIZipEntry = Components.interfaces.nsIZipEntry;
	    while(entries.hasMoreElements()) {
		    
		var entry = entries.getNext().QueryInterface(nsIZipEntry);
		//remove searchplugins and path separator		
		var filename = entry.name.substring(14);

		var target = dirService.get("SrchPlugns", Components.interfaces.nsILocalFile);	
		target.append(filename);

		if(!target.exists()){
		        
		    try{
		  	target.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
		    	if(target.exists() && target.isFile())	    
				zipReader.extract(entry.name, target);
		    }
		    catch(e){}
		}
		    
		var oEntry = zipReader.getEntry(entry.name.replace(".src",".gif"));
		if(oEntry != null){
		
		   filename = oEntry.name.substring(14);
	    	   target = target.parent;
	 	   target.append(filename);
		    	 
	   	   if(!target.exists()){ 
	   	      
	   	       try{
	 	          target.create( Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 0664);
		          if(target.exists() && target.isFile())	    
			      zipReader.extract(oEntry.name, target);
		       }
		       catch(e){}
		   }   
		}
      	     }
	 }    
	
	 zipReader.close();
         
        //need this function to show the engine after restarting the browser for the first time
        if (sdeliciousMain.getAppVersionNum().indexOf("2.") != 0 || sdeliciousMain.getPlatform() == "mac") {
          setTimeout("sdeliciousMain.addTmpEngine()", 500);
        }
      }	
      
      this.setEngineInList();   
      this.overwriteOwnDefaultPref("delicious.engine.installed", "pref(\"delicious.engine.installed\",true);");
   },

   setEngineInList : function(){
   
     try{
       deliciousEngine = "del.icio.us";
       var pref = Components.classes["@mozilla.org/preferences-service;1"]
   			.getService(Components.interfaces.nsIPrefBranch);
      
       var firstEngine, secondEngine, thirdEngine;
       try {
         firstEngine = pref.getComplexValue("browser.search.order.1",
             Components.interfaces.nsIPrefLocalizedString).data;
       }
       catch(e){ } 
      
       try{
         secondEngine = pref.getComplexValue("browser.search.order.2",
             Components.interfaces.nsIPrefLocalizedString).data;
       }
       catch(e){ }
      
       try {
         thirdEngine = pref.getComplexValue("browser.search.order.3",
             Components.interfaces.nsIPrefLocalizedString).data;
       }
       catch(e){ }
      
      
       pref.setCharPref("browser.search.order.1",
                             deliciousEngine);
                             
       if (firstEngine && firstEngine != deliciousEngine) {
         pref.setCharPref("browser.search.order.2",
	                    firstEngine);
         if (secondEngine && secondEngine != deliciousEngine) {
           pref.setCharPref("browser.search.order.3",
                            secondEngine);
         }       
       }
       else {
         if (secondEngine)
           pref.setCharPref("browser.search.order.2",
                            secondEngine);
         if (thirdEngine)
           pref.setCharPref("browser.search.order.3",
                            thirdEngine);                            
       }
      
     }
     catch(e){ }
   },

   shouldShowTmpEngine : function(){
   
       var wm = Components.classes["@mozilla.org/appshell/window-mediator;1"]
                      .getService(Components.interfaces.nsIWindowMediator);
       var enumerator = wm.getEnumerator("navigator:browser");
       while(enumerator.hasMoreElements()) {
          var win = enumerator.getNext();
          if(win != window){
             if(win.sdeliciousMain){
                return win.sdeliciousMain.showTmpEngine;
             }
          }
       }
   
   return false;
   },
   
   //restart after installing the extension, the delicious engine does not appear, this is a function to fix it
   addTmpEngine : function(){
   
        var rdfService = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                 .getService(Components.interfaces.nsIRDFService);
        
        const kNC_Name= rdfService.GetResource("http://home.netscape.com/NC-rdf#Name");
        const kNC_Icon= rdfService.GetResource("http://home.netscape.com/NC-rdf#Icon");
        var dirService = Components.classes['@mozilla.org/file/directory_service;1']
              	  	  	.getService(Components.interfaces.nsIProperties);		
        var handler = Components.classes["@mozilla.org/network/protocol;1?name=file"].
       	               createInstance(Components.interfaces.nsIFileProtocolHandler);
        var searchbar = document.getElementById("searchbar");       	               
        var menupopup = document.getAnonymousElementByAttribute (searchbar, 'anonid', 'searchbar-popup');
        var ds = Components.classes["@mozilla.org/rdf/rdf-service;1"]
                                 .getService(Components.interfaces.nsIRDFService).GetDataSource("rdf:internetsearch");        
     	if(!menupopup) return;
     
    	// See mozilla/xpcom/io/nsAppDirectoryServiceDefs.h for param[0]
	var srcfile = dirService.get("SrchPlugns", Components.interfaces.nsILocalFile);	
     	srcfile.append("delicious.src");
     	     	
     	if(srcfile.exists()){

     	   var grpfile = dirService.get("SrchPlugns", Components.interfaces.nsILocalFile);	
           grpfile.append("delicious.gif");
   	    
   	   var id = "engine://"+encodeURIComponent(srcfile.path);
      	   var menuitem = document.createElement("menuitem");   		
     	   menuitem.setAttribute("type", "checkbox");
     	   menuitem.setAttribute("id", id);
     	   menuitem.setAttribute("value", id);
     	   if(grpfile.exists())
     	     	menuitem.setAttribute("src", handler.getURLSpecFromFile(grpfile));
     	   else
     	        menuitem.setAttribute("src", "");
     	   menuitem.setAttribute("label", "del.icio.us");
   	   if(!document.getElementById(id)){
     	     	    
     	     var child = menupopup.childNodes;
     	     if(child.length>0)
     		menupopup.insertBefore(menuitem, menupopup.firstChild);
     	     else
     		menupopup.appendChild(menuitem);
     	     
     	     //in order to fix the icons does not display on the rdf:
     	     var rEngine = rdfService.GetResource(id);	     
     	     ds.Assert(rEngine, kNC_Name, rdfService.GetLiteral("delicious"),true);
     	     if(grpfile.exists())
     	        ds.Assert(rEngine, kNC_Icon, rdfService.GetLiteral(handler.getURLSpecFromFile(grpfile)) ,true);
     	     else    
     	        ds.Assert(rEngine, kNC_Icon, rdfService.GetLiteral("") ,true);
     	   }
     	   this.showTmpEngine = true;
     	}
   },
     
   overwriteOwnDefaultPref : function(aPrefName, aNewPrefStr){
   	  
      //this does not save the bool pref into the extension 1.0.X
      //so we need to open the file and rewrite it.
      //the delicious.js on Mac has read-only permission so we cannot rewrite it
      var dirService = Components.classes['@mozilla.org/file/directory_service;1']
      			.getService(Components.interfaces.nsIProperties);		
      var file = dirService.get("ProfD", Components.interfaces.nsILocalFile);	
      file.append("extensions");
      file.append("{5a2b4e34-ce62-42e9-a658-06ba4490adf8}");
      file.append("defaults");
      file.append("preferences");
      file.append("delicious.js");
	
      var prefName = aPrefName;
      var prefStr = aNewPrefStr;
      var oString = "";
      if (file.exists()){
	
 	    var is = Components.classes["@mozilla.org/network/file-input-stream;1"]
                        .createInstance(Components.interfaces.nsIFileInputStream);
	    is.init(file, 0x01, 0444, 0);
            is.QueryInterface(Components.interfaces.nsILineInputStream);
	    
	    var line = {};
            var lines = [], hasmore;
            do {
	        hasmore = is.readLine(line);
	        lines.push(line.value); 
	    } while(hasmore);
	
            var replaced = false;
            for(var i=0; i<lines.length; i++){
            
		if(lines[i].indexOf(prefName)>-1){
		   oString += prefStr+"\r\n";
		   replaced = true;
		}   
		else
		   oString += lines[i]+"\r\n";
            }
            
            is.close();
      }
	      	
      if(oString.length ==0 || !replaced)
        oString += prefStr+"\r\n";

      try{
        var os = Components.classes["@mozilla.org/network/file-output-stream;1"]
		.createInstance( Components.interfaces.nsIFileOutputStream);
        os.init(file, 0x04 | 0x08 | 0x20, 0664, 0);
        os.write(oString, oString.length);
        os.close();
      }
      catch(e){  
        //should not have this error except for mac
      }
      
      try{      
        var prefInt = Components.classes["@mozilla.org/preferences;1"]
    			.getService(Components.interfaces.nsIPref);
        prefInt.SetDefaultBoolPref(aPrefName, true); 
      }
      catch(e){}
   },
   
   firstTimeStart : function(){

     var bundle = document.getElementById("bundle_simpledelicious");
     var pref = Components.classes["@mozilla.org/preferences-service;1"]
     	 			.getService(Components.interfaces.nsIPrefBranch);
     var currentVersionNum  = bundle.getString("del_versionNum");	 			
     var addButtons = false;
     try{
     	var num = pref.getCharPref("delicious.version.number");
     	if(num!=currentVersionNum){
     	  pref.setCharPref("delicious.version.number", currentVersionNum);
     	  addButtons = true;
     	}   
     }
     catch(e){
        pref.setCharPref("delicious.version.number", currentVersionNum);
        addButtons = true;
     }     

     if(addButtons){
	
	//open first time window
        setTimeout(function(aUrl){ var browser = document.getElementById("content");
    		var tab = browser.addTab(aUrl);  
 		browser.selectedTab = tab;}, 
 		1000, 
 		sdeliciousMain.getDeliciousPath('/help/firefox/success?src=ffext'+sdeliciousMain.getExtVersionNum()));

     
    	var toolbox = document.getElementById("navigator-toolbox");
    	var toolboxDocument = toolbox.ownerDocument;
    
    	var hasDeliciousButton = false, hasTagPageButton = false;
    	for (var i = 0; i < toolbox.childNodes.length; ++i) {
    	    var toolbar = toolbox.childNodes[i];
    	    if (toolbar.localName == "toolbar" && toolbar.getAttribute("customizable")=="true") {
    			
    		if(toolbar.currentSet.indexOf("del-button-delicious")>-1)
    			hasDeliciousButton = true;	
    		if(toolbar.currentSet.indexOf("del-button-tagPage")>-1)
    			hasTagPageButton = true;
    	    }
    	}
    		
    	if(!hasDeliciousButton || !hasTagPageButton){
    		
    	  for (var i = 0; i < toolbox.childNodes.length; ++i) {
    	    toolbar = toolbox.childNodes[i];
    	    if (toolbar.localName == "toolbar" &&  toolbar.getAttribute("customizable")=="true" && toolbar.id=="nav-bar") {
    					
    	   	var newSet = "";
    	   	var child = toolbar.firstChild;
    	   	while(child){
    		   	   
    	   	   if(!hasDeliciousButton && (child.id=="del-button-tagPage" || child.id=="urlbar-container")){		   	      
    		      newSet += "del-button-delicious,";
    		      hasDeliciousButton = true;
    	   	   }
    	   	   
    	   	   if(!hasTagPageButton && child.id=="urlbar-container"){
    		      newSet += "del-button-tagPage,";
    	   	      hasTagPageButton = true;
    		   }
    
    		   newSet += child.id+",";
    		   child = child.nextSibling;
    		}
    		
    		newSet = newSet.substring(0, newSet.length-1);
    		toolbar.currentSet = newSet;
    		
    		toolbar.setAttribute("currentset", newSet);
    		toolboxDocument.persist(toolbar.id, "currentset");
    		BrowserToolboxCustomizeDone(true)
    		break; 
    	    }
    	  }
    	}
     }
   },   
               
   setUser : function(aUser){
		var hw=sdeliciousMain.getHiddenWindow();
		if(defined(hw)){
			hw.user=aUser;
		}
		else sdeliciousMain.user=aUser;
   },
   loadUser:function(){
		var loginMan=sdeliciousMain.getLoginManager();
		//alert('load user '+loginMan+","+loginMan.addUser);
		if(defined(loginMan.addUser))return sdeliciousMain.loadUserFromPasswordManager();
		else return sdeliciousMain.loadUserFromLoginManager();
   },
   loadUserFromPasswordManager:function(){
		var host ='https://api.del.icio.us';
		var e = sdeliciousMain.getLoginManager().enumerator;
		// step through each password in the password manager until we find the one we want:
		while (e.hasMoreElements()) {
			try {
				// get an nsIPassword object out of the password manager.
				// This contains the actual password...
				var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
				
				if (pass.host == host) {
					//console.log('pass found '+pass.username+','+pass.password);
					pass=copy_obj(pass);
					pass.username=pass.user;
					return pass;
				}		
				break;
			}
			catch (ex) {
				// do something if decrypting the password failed--probably a continue
				alert('loadUserFromPasswordManager: '+ex);
			}
		}
		return false;
   },
   loadUserFromLoginManager:function(){
		var hostname = 'https://api.del.icio.us';//'chrome://simpleDelicious';
		var formSubmitURL = null;  // not http://www.example.com/foo/auth.cgi
		var httprealm = "del.icio.us API";
		try {
			// Get Login Manager 
			var myLoginManager = sdeliciousMain.getLoginManager();
			// Find users for the given parameters
			//var logins = myLoginManager.findLogins({}, hostname, formSubmitURL, httprealm);
			
			var logins=myLoginManager.getAllLogins({});
			for(var i=0;i<logins.length;i++){
				//console.log('loadUserFromLoginManager '+logins[i].hostname);
				if(logins[i].hostname == hostname){
					return logins[i];
				}
			}
			/*
			if(logins.length>0){
				return logins[0];
			}*/	
		}
		catch(ex) {
			// This will only happen if there is no nsILoginManager component class
			alert('exception in loadUser '+ex);
		}
		return false;
   },
   loadUserFromPref:function(){
   
 	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
	prefs = prefs.getBranch("extensions.simpleDelicious.");

	var username=null;
	var password=null;
	try{
		username=prefs.getCharPref("username");
		password=prefs.getCharPref("password");
	}catch(e){
		//alert(e);
	}
	if(username==null || password==null){
		//alert("return null");
		return null;
	}
	var user={};
	user.username=username;
	user.password=password;
	//alert("in pref username pass are "+user.username+","+user.password);
	return user;  		
   },
   	
   getUser : function() {
   	//alert("in getuser user is "+this.user);
	var hw=sdeliciousMain.getHiddenWindow();
	if(defined(hw) && defined(hw.user)){
		return hw.user;
	}
	if(defined(sdeliciousMain.user))return sdeliciousMain.user;
	var user=sdeliciousMain.loadUser();	
	//alert("load from pref returns "+user);
	/*
	if(user==null){
		//alert("try to load user from cookie");
		user=loadUserFromCookie();
		//alert("after load user from cookie");
	}*/
	
	sdeliciousMain.setUser(user);
	return user; 
   },
   

   getPlatform : function(){

    var platform = new String(navigator.platform);
    var str = "";
    if(!platform.search(/^Mac/)) 
       str = "mac";
    else if(!platform.search(/^Win/))
       str = "win";
    else 
       str = "unix";

   return str; 
   },

   getAppVersionNum : function(){
     
     var num = "";
     var pref = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);
     try{
        num = pref.getCharPref("general.useragent.vendorSub");
     }
     catch(e){}
   
     try{
        if(num.length==0){
          var str = pref.getCharPref("general.useragent.extra.firefox");
          var pos = str.indexOf("/")
          if(pos>-1)
            num = str.substring(pos+1); 
          else
            num = str;
        }  
     }
     catch(e){}
     
   return num;
   },
   
   getExtVersionNum : function(){

        var bundle = document.getElementById("bundle_simpledelicious");
        var num  = bundle.getString("sdel_versionNum");
   
   return num;
   },
   
   //the properties used in the loadTagPage and loadTagLink functions
   openPopupWindow : function(aPath, aWidth, aHeight, anOption){
           
      //make it center	
      var width = aWidth, height = aHeight;
      var left = parseInt((screen.availWidth/2) - (width/2)); 
      var top  = parseInt((screen.availHeight/2) - (height/2));
      
      var props = "width="+width+",height="+height+",left="+left+",top="+top+",menubar=0,toolbar=0,scrollbars=1,location=0,status=1,resizable=1";
      if(anOption)
        props +=","+anOption;
      var newWindow = window.openDialog(aPath, "", props);      
      newWindow.focus();
   },
   
   //for tag this page with notes
   getSelectedText : function(charlen) {
   
       var focusedWindow = document.commandDispatcher.focusedWindow;
       var searchStr = focusedWindow.getSelection();      
       searchStr = searchStr.toString();
       
       var originalSearchStrLength = searchStr.length;

       if (!charlen)
            charlen = 4096;
       if (charlen < searchStr.length) {
      
          var pattern = new RegExp("^(?:\\s*.){0," + charlen + "}");
          pattern.test(searchStr);
          searchStr = RegExp.lastMatch;
       }
      
       searchStr = searchStr.replace(/^\s+/, "");
       searchStr = searchStr.replace(/\s+$/, "");
       searchStr = searchStr.replace(/\s+/g, " ");
    
    return {str:searchStr, len:originalSearchStrLength};
   },

   //get domain path and append additional path to it
   getDeliciousPath : function(aPath){
   
      var domainPath = "http://del.icio.us";
      var rPath;
      
      if(aPath)
        rPath = domainPath + aPath;
      else
        rPath = domainPath;
   
   return rPath;
   },
      
   loadDeliciousPage : function(event, aMouseClick){
   
      var url = this.getDeliciousPath("/home");

      this.UIloadPage(event, url, aMouseClick);      
      //onStateChange would handle the login status
   },
   
   loadTagPage: function(){

      var notes ="";
      var selectedObj = this.getSelectedText(4096);
      if(selectedObj && selectedObj.len>4096){
        
          var bundle = document.getElementById("bundle_simpledelicious");
			
	  	var promptService = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
	  	.getService(Components.interfaces.nsIPromptService);
	  promptService.alert(null, bundle.getString("sdel_notesLimitErrorDialogTitle"), bundle.getFormattedString("sdel_notesLimitError", [selectedObj.len, "4096"]));	

      return;	      
      }
      else{
      	if(selectedObj.str)
      	  notes = selectedObj.str;
      }
      
		//alert("user is "+sdeliciousMain.getUser().username);
      var location, title;
      var browser = window.getBrowser();
      var webNav = browser.webNavigation;
      if(webNav.currentURI)
          location = webNav.currentURI.spec;
      else
          location = gURLBar.value;  
      
      if(webNav.document.title){
       title = webNav.document.title;
      } 
      else
       title = location;
   
      this.openPopupWindow(this.getDeliciousPath("/post?url="+encodeURIComponent(location)+"&title="+encodeURIComponent(title)+"&notes="+encodeURIComponent(notes)+"&v=4&noui&jump=close&src=ffext"+this.getExtVersionNum()), 700, 400);
     
	  //alert("user is "+sdeliciousMain.getUser().username);
      //onStateChange would handle the login status
   },
   
   loadTagLink : function(aURL, aText){
      
      this.openPopupWindow(this.getDeliciousPath("/post?url="+encodeURIComponent(aURL)+"&title="+encodeURIComponent(aText)+"&notes=&v=4&noui&jump=close&src=ffext"+this.getExtVersionNum()), 700, 400);
      
      //onStateChange would handle the login status
   },
   
   loadShowRelatedPage : function(event, aMouseClick){
      
      var location;
      var browser = getBrowser();
      if(browser && browser.currentURI)
          location = browser.currentURI.spec;
      else
          location = gURLBar.value;
      
      this.UIloadPage(event, this.getDeliciousPath("/url?url="+encodeURIComponent(location)), aMouseClick);
      //loadURI(this.getDeliciousPath("/url?url="+encodeURIComponent(location)));
   },
   
   loadRelevantPage : function(event, aStr, aMouseClick){
         
      var user = this.user;
      var url = null;
      switch(aStr){
        case "login":
	  if(!user)
            url = this.getDeliciousPath("/login");
          else
            url = this.getDeliciousPath("/logout");
        break;
        case "mydelicious":
          if(!user)
            url = this.getDeliciousPath("/login");
          else
            url = this.getDeliciousPath("/home");
        break;
        case "inbox":
          if(!user)
            url = this.getDeliciousPath("/login");
          else
            url = this.getDeliciousPath("/inbox/"+user);
        break;
        case "for":
          if(!user)
            url = this.getDeliciousPath("/login");
          else
            url = this.getDeliciousPath("/for/"+user);
        break;
        case "popular":
            url = this.getDeliciousPath("/popular/");  
        break;
        case "settings":
          if(!user)
            url = this.getDeliciousPath("/login");
          else
            url = this.getDeliciousPath("/settings/"+user+"/profile");
        break;     
        case "about":
           url = this.getDeliciousPath("/about/");
        break;
        case "help":
           url = this.getDeliciousPath("/help/");
        break;
        default:
            url = this.getDeliciousPath();
        break;
      }
      
      if(url)
        this.UIloadPage(event, url, aMouseClick);
   },
   
   openURL:function(url){
   		 var browser = document.getElementById("content");
		 browser.loadURI(url);
		 
   },
   openURLTab:function(url) {
		getBrowser().selectedTab=getBrowser().addTab(url);
   },
	openURLWindow:function(url){
		window.open(url);
	},	
    UIloadURL : function(event, aUrl, aMouseClick){
   
      var browser = document.getElementById("content");
      if(aMouseClick){
        //alert("click "+event.button);
		//if(event.button == 1){
  	  		var tab = browser.addTab(aUrl);  
 	 		browser.selectedTab = tab;
	
	 		 if(event.target.localName == "menuitem"){
	    		event.target.parentNode.hidePopup();
				//alert("loadURI "+aUrl);
        		browser.loadURI(aUrl);
      			
			}
    	//}
	  }
	 },
   
   UIloadPage : function(event, aUrl, aMouseClick){
   
      var browser = document.getElementById("content");
      if(aMouseClick){
        if(event.button == 1){
  	  var tab = browser.addTab(aUrl);  
 	  browser.selectedTab = tab;
	
	  if(event.target.localName == "menuitem")
	    event.target.parentNode.hidePopup();
        }
      }
      else{
        if(!event){
          browser.loadURI(aUrl);
        
        return;
        }
        
        var shift = event.shiftKey;     
        var ctrl =  event.ctrlKey;                
        if (ctrl) {    
          var tab = browser.addTab(aUrl);  
          browser.selectedTab = tab;
        }
        else if(shift){
          openDialog("chrome://browser/content/browser.xul", "_blank", "chrome,all,dialog=no", aUrl);
        }
        else
          browser.loadURI(aUrl);
      }  
   
   return;
   },
    createMenuItem: function(conf) {
    	
		var mi = document.createElement('menuitem');
    	//mi.setAttribute('id', menuitems[i]);
   		if(conf.label){
			mi.setAttribute('label', conf.label);
			
		}
		if(conf.value)mi.setAttribute('value', conf.value);
		if(conf.tooltip)mi.tooltipText=conf.tooltip;
		if(conf.statusText)mi.setAttribute('statustext',conf.statusText);
		/*
                mi.setAttribute('allowevents',true);
		mi.addEventListener('keydown',function(evt){
			alert(evt);
		}, true);	
                */
		
		return mi;
	}, 
	
    createMenu: function(aLabel) {
    	
		var mi = document.createElement('menu');    
    	//mi.setAttribute('id', menuitems[i]);
   		mi.setAttribute('label', aLabel);
		mi.setAttribute('allowevents',true);
		
		var popup=document.createElement('menupopup');
		mi.appendChild(popup);
		
		mi.addEventListener('keydown',function(evt){
			alert(evt);
		}, true);
  		return mi;
	},	
	addBookMark:function(){
		sdeliciousMain.loadTagPage();
	},
	createMenuSeparator:function(id){
		var s=document.createElement('menuseparator');
		s.id=id;
		return s;
	},
	showHardMenu:function(){
		
	
		var dpopup=document.getElementById("dpopup");
		var menuseparator = sdeliciousMain.createMenuSeparator();
		if(Util.indexOfByNodeId(dpopup.childNodes, "menuseparator")<0){
			menuseparator.id='menuseparator';
			dpopup.insertBefore(menuseparator,dpopup.firstChild);
		}
		if(Util.indexOfByNodeId(dpopup.childNodes, "refreshMenu")<0){
			var refreshMenuItem=sdeliciousMain.createMenuItem({label:"Refresh Bookmarks..."});
			refreshMenuItem.id='refreshMenu';
			refreshMenuItem.setAttribute("allowEvents",false);
			dpopup.insertBefore(refreshMenuItem, dpopup.firstChild);
			
			refreshMenuItem.setAttribute('oncommand', 'sdeliciousMain.refresh()');
		}	
		if(Util.indexOfByNodeId(dpopup.childNodes, "addBookmarkMenu")<0){
			var addBookmarkMenuItem=sdeliciousMain.createMenuItem({label:"Bookmark this Page..."});
			addBookmarkMenuItem.id='addBookmarkMenu';
			dpopup.insertBefore(addBookmarkMenuItem, dpopup.firstChild);
			
			addBookmarkMenuItem.setAttribute('oncommand', 'sdeliciousMain.addBookMark()');
			
		}
		
	},
	openMenu:function(){
		var menu=document.getElementById("simple_delicious-menu");
		
		var menupopup=document.getElementById("dpopup");
		menupopup.showPopup(4,menu,"bottomleft");
		//menupopup.showPopup(menu,-1,-1,"popup","bottomleft","topleft")  
		/*
		//showMenuTags();
		var dpopup=document.getElementById('dpopup');
		Util.log("dpopup is "+dpopup);
		dpopup.hidePopup();
		//dpopup.showPopup(menu,-1,-1); //wrong
		*/		
	},
	refresh:function(){
		//todo

		sdeliciousMain.posts=null;
		sdeliciousMain.openMenu();
		Util.log("done refresh");
	},
	showMenuTags2:function(event){
		try{
			if(event.target.id!="dpopup")return;
			}catch(e){
				Util.log(e);
			}
	},
	clearMenu:function(){
		var dpopup=document.getElementById("dpopup");
		Util.removeChildren(dpopup);
	},
	updateMenuFromData:function(data){
		sdeliciousMain.clearMenu();
		sdeliciousMain.buildBookmarks(data[0],data[1]);
		sdeliciousMain.showHardMenu();
		
		
	},
	showMenuTags: function(event){
		
		try{
			Util.log("in showMenuTags tagsLoading "+this.tagsLoading);
			if(event.target.id!="dpopup")return;
			
			if(this.tagsLoading || sdeliciousMain.tagsLoadingProgressId>0){
				Util.log("id is "+sdeliciousMain.tagsLoadingProgressId);			
				return;
			}
			Util.log("before loadGlobalData");
			var data=sdeliciousMain.getGlobalData();
			Util.log("data is "+data);
			Util.log(this.lastRetrieveTime);
			if(data!=null && (this.lastRetrieveTime==null || this.lastRetrieveTime.getTime()< data.lastRetrieveTime.getTime())){
				Util.log("globalData is not null");
				sdeliciousMain.updateMenuFromData(data);
				this.posts=data[0];
				this.tags=data[1];			
				this.lastRetrieveTime=data.lastRetrieveTime;
				Util.log("set lastRetrieveTime to "+this.lastRetrieveTime);
			
			}
			Util.log("posts are "+this.posts);
			Util.log("tags are "+this.tags);
			Util.log("lastRetrieveTime "+this.lastRetrieveTime);
		
			if(this.posts == null || this.tags == null || this.lastRetrieveTime == null){
				sdeliciousMain.clearMenu();
				sdeliciousMain.showHardMenu();			
				//sdeliciousMain.tagsLoadingProgressId=setInterval("sdeliciousMain.checkTagsLoadingProgress();",100);				
				//sdeliciousMain.updateMenuTags();
				Util.log("call updateMenuTags ");
				Util.callFunc("sdeliciousMain","updateMenuTags");
			}
			else{
				Util.log("call cehckMenuTagsUpdate");
				Util.callFunc("sdeliciousMain","checkMenuTagsUpdate");
			}
		}catch(e){
			Util.log(e);
		}
		
	},
	checkTagsLoadingProgress: function(){
		//Util.log("checktagsLoadingProgress "+sdeliciousMain.tagsLoading);
		if(sdeliciousMain.tagsLoading){
			sdeliciousMain.showTagsLoadingProgress(1);
			setTimeout("sdeliciousMain.checkTagsLoadingProgress()",100);
		}
		else {
			
			sdeliciousMain.showTagsLoadingProgress(0);
			sdeliciousMain.stopCheckTagsLoadingProgress();
		}
		
		
	},
	createTagsLoadingGUI : function(){
		var el=document.createElement('menuitem');
		Util.log("el is "+el);
		//el.setAttribute('image','chrome://simpledelicious/skin/appInstall_animated.gif');
		el.setAttribute('image','chrome://simpledelicious/skin/anim_process.gif');
		el.setAttribute('label','loading');
		el.setAttribute("orient","vertical");
		el.setAttribute("class", 'menuitem-iconic');
		el.setAttribute('width','80');
		el.setAttribute('height','60');
		return el;
		
	},
	
	showTagsLoadingProgress:function(show){
		try{
		var pop=document.getElementById("dpopup");
		
		
		if(show){
		
			if(!isObject(this.tagsLoadingGUI)){
				
				this.tagsLoadingGUI=sdeliciousMain.createTagsLoadingGUI();
					
				
			}
			var menuSeparator=null;
				var menuSepIndex=Util.indexOfByNodeId(pop.childNodes, "menuseparator");
				if(menuSepIndex>=0){
					menuSeparator=pop.childNodes[menuSepIndex];
				}
			
				pop.insertBefore(this.tagsLoadingGUI,menuSeparator);
		
		}
		else{
			
			if(isObject(this.tagsLoadingGUI)){
				
				pop.removeChild(this.tagsLoadingGUI);
				this.tagsLoadingGUI=null;
			}
		}
		}catch(e){
			Util.log("Exception in showTagsLoadingProgress: "+e);
		}
		
	},
	
	parseTime:function(str){
		var tokens=str.substring(0,str.length-1).split("T");
		var date=tokens[0];
		var time=tokens[1];
		var dateToks=date.split("-");
		var yr=dateToks[0];
		var month=dateToks[1];
		var day=dateToks[2];
		var timeToks=time.split(":");
		var hr=timeToks[0];
		var min=timeToks[1];
		var sec=timeToks[2];
		var d=new Date();
		
		d.setUTCFullYear(yr);
		d.setUTCMonth(month-1);
		d.setUTCDate(day);
		d.setUTCHours(hr);
		d.setUTCMinutes(min);
		d.setUTCSeconds(sec);
		return d;
		
	},
	clearUsersFromAuthManagerAllAPIs:function(){
		var apis=sdeliciousMain.getAllAPIs();
		for(var i=0;i<apis.length;i++){
			var user=sdeliciousMain.loadUserFromAuthManager(apis[i]);
			if(defined(user))
				sdeliciousMain.storeUserToAuthManager(apis[i],{username:user.username,password:'',userdomain:user.userdomain}); 	
		}	
	
	},
	loadUserFromAuthManagerAnyAPI:function(){
		var apis=sdeliciousMain.getAllAPIs();
		for(var i=0;i<apis.length;i++){
			var user=sdeliciousMain.loadUserFromAuthManager(apis[i]);
			if(defined(user))
				return user;
		}
		return false;
	},
	storeUserToAuthManagerAllAPIs:function(user){//might be able to optimize later
		var apis=sdeliciousMain.getAllAPIs();
		for(var i=0;i<apis.length;i++){
			sdeliciousMain.storeUserToAuthManager(apis[i],user); 
		}
		
	},
	storeUserToAuthManager:function(urlSpec, user){
		try{
			var authmanager = Components.classes["@mozilla.org/network/http-auth-manager;1"].getService(Components.interfaces.nsIHttpAuthManager);

			var uri =Components.classes["@mozilla.org/network/standard-url;1"].createInstance();
			uri.QueryInterface(Components.interfaces.nsIURI);
			uri.spec = urlSpec;
			if(uri.port == -1) uri.port = 443;
			Util.log("scheme is "+uri.scheme);
			Util.log("host is "+uri.host);
			Util.log("port is "+uri.port);
			Util.log("path is "+uri.path);
			var userdomain= user.userdomain || null;
			authmanager.clearAll();
			authmanager.setAuthIdentity(uri.scheme, uri.host, uri.port,
                            "basic", null, uri.path,
                            userdomain, user.username, user.password); 
		//	alert('store user from auth manager '+uri.scheme+","+uri.host+","+uri.port+","+uri.path+","+user.username+","+user.password+","+userdomain);
			
		}catch(ex){
			Util.log(ex+"");
		}
				
	},
	loadUserFromAuthManager:function(urlSpec){
		try{
		 var authmanager = Components.classes["@mozilla.org/network/http-auth-manager;1"].getService(Components.interfaces.nsIHttpAuthManager);
		 //authmanager.query(Components.interfaces.nsIHttpAuthManager);
		
		 
		 var uri =Components.classes["@mozilla.org/network/standard-url;1"].createInstance();
		
		//"nsIURI");
		
		uri.QueryInterface(Components.interfaces.nsIURI);
		uri.spec = urlSpec;
		
		if(uri.port == -1) uri.port = 443;
		
		Util.log("scheme is "+uri.scheme);
		Util.log("host is "+uri.host);
		Util.log("port is "+uri.port);
		Util.log("path is "+uri.path);
		var userdomain={};
		var username={};
		var userpassword={};
		authmanager.getAuthIdentity(uri.scheme, uri.host, uri.port,
                            "basic", '', uri.path,
                            userdomain, username, userpassword); 

		//alert('load user from auth manager '+uri.scheme+","+uri.host+","+uri.port+","+uri.path+","+username.value+","+userpassword.value);
		if(username.value=='' || userpassword.value==''){
			return null;
		}
		var login={};
		login.username=username.value;
		login.password=userpassword.value;
		login.userdomain=userdomain.value;
		
		return login;
		}catch(ex){
			Util.log(ex+"");
		}
		return null;		
	},
	notifyLoginChange:function(){
		var gb=sdeliciousMain.getGlobalData();
		if(defined(gb))gb.needRefresh=true;
		else sdeliciousMain.needRefresh=true;
	},
	//find changes and update in the background, do not block
	checkMenuTagsUpdate: function(){
		//Util.log("checkMenuTagsUpdate set tagsLoading to true");
	
		sdeliciousMain.tagsLoading=true;
		sdeliciousMain.checkTagsLoadingProgress();
		try{
		var req = new XMLHttpRequest();
  	

 		req.onreadystatechange = function()
  		{	try{
    		if(req.readyState == 4)
   			{
       			if(req.status == 200){		
					Util.log("done checkMenuTagsUpdate");
					
					var updateEl=req.responseXML.getElementsByTagName("update")[0];
					
					var timeAttr=updateEl.getAttribute("time");
					var updateTime=sdeliciousMain.parseTime(timeAttr);
					//store login from authManager to pref, this is to ensure that the correct login gets stored to pref(in case the user entered the wrong login into the prompt box the first time
						
						//var authUser=sdeliciousMain.loadUserFromAuthManager("https://api.del.icio.us/v1/posts/update?meta=1");
						var authUser=sdeliciousMain.loadUserFromAuthManager(sdeliciousMain.UPDATE_API);
						if(defined(authUser) && defined(authUser.username) && defined(authUser.password) && isString(user.username) && isString(authUser.password)){
							//alert("storeUserToPref");
							//alert("storeUser from authmanager "+authUser.username+","+authUser.password);
							//sdeliciousMain.storeUserToPref(authUser);
							sdeliciousMain.storeUser(authUser);
						}
						
						
					//store login from loginManager to pref
					
					var lastRetrieveTime=sdeliciousMain.lastRetrieveTime;
					Util.log("lastRetrieveTime is "+lastRetrieveTime);
					Util.log("updateTime is "+updateTime);
					//need to add a flag to indicate that refresh is needed because updateTime and lastRetrievalTime is not accurate
					if(sdeliciousMain.getNeedRefresh()|| lastRetrieveTime==null || Math.floor(lastRetrieveTime.getTime()/1000) <= 4+Math.floor(updateTime.getTime()/1000)){
						Util.log("lastRetrieve time is "+Math.floor(lastRetrieveTime.getTime()/1000));
						Util.log("updateTime is "+ Math.floor(updateTime.getTime()/1000));
						
						Util.log("need refresh!!!!!!!");
						
						Util.callFunc("sdeliciousMain","updateMenuTags");
						
						
					}
					else sdeliciousMain.tagsLoading=false;
				}
				else{
					Util.log("checkMenuTagsUpdate set tagsLoading to false");
					sdeliciousMain.tagsLoading=false;
				} 
			}
		}catch(exp){
				Util.log(exp+"");
				sdeliciousMain.tagsLoading=false;
		}
		}
		var user=sdeliciousMain.getUser();
		var username=null;
		var password=null;
		if(defined(user)){
			username=user.username;
			password=user.password;
		}
		/*
		if(defined(username) && defined(password)){
			alert("send "+username+" "+password);
			req.open("POST", "https://api.del.icio.us/v1/posts/update?meta=1&src=ffbmext1.3.82");
			
			//req.open("POST", "https://api.del.icio.us/v1/posts/update", true,username,password);
  		}
		else {
			var login=sdeliciousMain.promptForLogin();
		
			if(defined(login) && defined(login.username) && defined(login.password)){
				sdeliciousMain.storeUser(login);
				//alert("send prompt login "+login.username+","+login.password);
				req.open("POST", "https://api.del.icio.us/v1/posts/update?meta=1&src=ffbmext1.3.82");
				username=login.username;
				
				password=login.password;
			}
		}*/
		
		
		
		req.open("POST", sdeliciousMain.UPDATE_API+"?meta=1&src=ffbmext1.3.82");
			
		if(defined(username) && defined(password)){
			req.setRequestHeader('Authorization', 'basic ' + Util.base64(username + ':' + password));
			
		}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.setRequestHeader('User-Agent', 'ffbmext1.3.82');  
  		req.send(null);		
		}catch(e){
			sdeliciousMain.tagsLoading=false;
		}					
		
	},
	storeUserToPref:function(user){
		var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
		prefs = prefs.getBranch("extensions.simpleDelicious.");

		var username=user.username;
		var password=user.password;
		
		//alert("store user to pref "+username+","+password);
		prefs.setCharPref("username",username);
		prefs.setCharPref("password",password);
	},
	storeUser:function(user){
		 
		sdeliciousMain.store(user,sdeliciousMain.getLoginManager());
		
	},
	store:function(user, loginMan){
		
		if(defined(loginMan.addUser))sdeliciousMain.passwordManagerStore(user,loginMan);
		else sdeliciousMain.loginManagerStore(user,loginMan);
	},
	clearUser:function(user){
		sdeliciousMain.setUser(null);
		var loginMan=sdeliciousMain.getLoginManager();
		//alert('load user '+loginMan+","+loginMan.addUser);
		if(defined(loginMan.addUser))return sdeliciousMain.clearUserFromPasswordManager(user);
		else return sdeliciousMain.clearUserFromLoginManager(user);
	},
	clearUsers:function(){
		sdeliciousMain.setUser(null);
		var loginMan=sdeliciousMain.getLoginManager();
		//alert('load user '+loginMan+","+loginMan.addUser);
		if(defined(loginMan.addUser))return sdeliciousMain.clearUsersFromPasswordManager();
		else return sdeliciousMain.clearUsersFromLoginManager();
	},	
	clearUsersFromPasswordManager:function(){
		var hostname = 'https://api.del.icio.us';
		var e = sdeliciousMain.getLoginManager().enumerator;
		// step through each password in the password manager until we find the one we want:
		while (e.hasMoreElements()) {
			try {
				// get an nsIPassword object out of the password manager.
				// This contains the actual password...
				var pass = e.getNext().QueryInterface(Components.interfaces.nsIPassword);
				//alert('in clear from password manager '+pass.host);
				if (pass.host == hostname) {
					//console.log('remove user '+pass.user);
					sdeliciousMain.getLoginManager().removeUser(hostname,pass.user);
				}		
			}
			catch (ex) {
				// do something if decrypting the password failed--probably a continue
				alert('loadUserFromPasswordManager: '+ex);
			}
		}
		
	},
	getNeedRefresh:function(){
		var gb=sdeliciousMain.getGlobalData();
		return defined(gb)?gb.needRefresh||sdeliciousMain.needRefresh:sdeliciousMain.needRefresh;
		
	},
	clearUserFromPasswordManager:function(user){
		var hostname = 'https://api.del.icio.us';
		sdeliciousMain.getLoginManager().removeUser(hostname,user.username);
	},
	clearUserFromLoginManager:function(user){
		var hostname = 'https://api.del.icio.us';
		var formSubmitURL = null;
		var httprealm = "del.icio.us API";
		var username = user.username;

		try {
			// Get Login Manager 
			var passwordManager = sdeliciousMain.getLoginManager();
			// Find users for this extension 
			//var logins = passwordManager.findLogins({}, hostname, formSubmitURL, httprealm);
			var logins = passwordManager.getAllLogins({});
			for (var i = 0; i < logins.length; i++) {
				if (logins[i].hostname == hostname && logins[i].username == username) {
					//console.log('remove logins '+logins[i].hostname+","+logins[i].username);
					passwordManager.removeLogin(logins[i]);
				}
			}
		}
		catch(ex) {
			// This will only happen if there is no nsILoginManager component class
			alert('clearUsrFromLoginManager: '+ex);
		}		
	},
	clearUsersFromLoginManager:function(){
		var hostname = 'https://api.del.icio.us';
		var formSubmitURL = null;
		var httprealm = "del.icio.us API";
		

		try {
			// Get Login Manager 
			var passwordManager = sdeliciousMain.getLoginManager();
			// Find users for this extension 
			//var logins = passwordManager.findLogins({}, hostname, formSubmitURL, httprealm);
			var logins = passwordManager.getAllLogins({});
			for (var i = 0; i < logins.length; i++) {
				if (logins[i].hostname == hostname) {
					//console.log('remove logins '+logins[i].hostname+","+logins[i].username);
					passwordManager.removeLogin(logins[i]);
				}
			}
		}
		catch(ex) {
			// This will only happen if there is no nsILoginManager component class
			alert('clearUsrFromLoginManager: '+ex);
		}		
	},	
	passwordManagerStore:function(user, passMan){
		try{
			var host='https://api.del.icio.us';
			passMan.addUser(host,user.username,user.password);
		}catch(ex){
			alert('passwordManagerStore: '+ex);
		}		
	},
	loginManagerStore:function(user, loginMan){
	try{
		var host ='https://api.del.icio.us';
		var formSubmitURL=null;
		var httprealm="del.icio.us API";
		
		var nsLoginInfo = new Components.Constructor("@mozilla.org/login-manager/loginInfo;1",
                                             Components.interfaces.nsILoginInfo,
                                             "init");
		var loginInfo = new nsLoginInfo(host,
						formSubmitURL, httprealm,
                      user.username, user.password, "", "");
					  
					 
		//var logins=loginMan.findLogins({},host,formSubmitURL,httprealm);  //this shit not working!
		var logins=loginMan.getAllLogins({});
		for(var i=0;i<logins.length;i++){
			//console.log('in loginManagerStore iterate thru'+logins[i].username);
			//alert('login '+logins[i].hostname+","+logins[i].username+','+logins[i].httpRealm);
			if(logins[i].hostname == host){
				loginMan.removeLogin(logins[i]);
			
				//loginMan.modifyLogin(logins[i], loginInfo);				
			}
		}
		
		loginMan.addLogin(loginInfo);
		 
		 //var L=loginMan.getAllLogins({})[0];
		//alert('after store '+L.username+","+L.password+","+L.hostname+","+L.formSubmitURL+","+L.httprealm);
	}catch(ex){
		alert('loadManagerStore: '+ex);
	}
	},
	getLoginManager:function(){
		if(!defined(sdeliciousMain.loginManager)){
			if ("@mozilla.org/passwordmanager;1" in Components.classes) {
				// Password Manager exists so this is not Firefox 3 (could be Firefox 2, Netscape, SeaMonkey, etc).
				// Password Manager code
				sdeliciousMain.loginManager = Components.classes["@mozilla.org/passwordmanager;1"]
                                .getService(Components.interfaces.nsIPasswordManager);
			}
			else if ("@mozilla.org/login-manager;1" in Components.classes) {
				// Login Manager exists so this is Firefox 3
				// Login Manager code
				 sdeliciousMain.loginManager=Components.classes["@mozilla.org/login-manager;1"]
                                .getService(Components.interfaces.nsILoginManager);
					  
					  
			}
		}
		return sdeliciousMain.loginManager;
	},
	promptForLogin:function(){
		try{
			var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
            .getService(Components.interfaces.nsIPromptService);
      		var check = {value: false};
			
      		var flags = prompts.STD_OK_CANCEL_BUTTONS;
			var user={};
			var pass ={};
      		var ans = prompts.promptUsernameAndPassword(window,"Enter password","Descriptive text",user,pass,null,{});
      		
	  		if(ans){
				
				var login={};
				login.username=user.value;
				login.password=pass.value;
				
      			return login;
      		}
			else return null;
		
		}catch(ex){
			alert(ex+"");
			return null;
		}
		
	},
	parseResponseData:function(postArray){
				Util.log("build bookmarks!!! "+postArray.length);
				this.posts=new Object();
				
				this.tags=new Array();
				
				for(var i=0;i<postArray.length;i++){
					//if(i>1)break;
					var p=postArray[i];
				
					var tag=p.attributes['tag'];
					//alert("ta is "+tag.value);
					var mtags=tag.value.split(' ');
					for(var j=0; j<mtags.length;j++){
						
						if(!(this.posts[mtags[j]] instanceof Array)){
							this.posts[mtags[j]]=new Array();
						}
						
						
						//Util.log(p.attributes['description'], true);
						
						if(this.tags.indexOf(mtags[j])<0){
							
							this.tags.push(mtags[j]);
							
						}
						var tagItem=new TagItem({href : p.getAttribute('href'), description:p.getAttribute('description')});							
				
						this.posts[mtags[j]].push(tagItem);
						
						for(var k=0;k<mtags.length;k++){
							if(k==j)continue;							
							if(	this.posts[mtags[j]].siblings == null){
								this.posts[mtags[j]].siblings = new Array();
							}
							if(!Util.contains(this.posts[mtags[j]].siblings, mtags[k]))
								this.posts[mtags[j]].siblings.push(mtags[k]);
							//alert("push tags "+mtags[k]);
						}
					}
				}
				
				
				sdeliciousMain.sortTags(this.tags);	
				var res=new Array();
				res[0]=this.posts;
				res[1]=this.tags;
				return res;
					
	},
	
	buildBookmarks:function(posts, tags){
		try{
				//populate menu
				
				 var pop=document.getElementById("dpopup");
				
				 
			
				
				Util.removeChildren(pop);
				//Util.purge(pop);
				sdeliciousMain.buildMenusFromBookmarks(posts, tags, pop);
			
		}catch(ex){
			alert(ex+"");
		}	
				
				
				
        	
					
	},
	sortTags:function(tags){
		tags.sort(Util.sortString);
	},
	
	
	buildMenusFromBookmarks:function(content,roots,bg){
		
		for(var i=0;i<roots.length;i++){
			var a=new Array();
			sdeliciousMain.buildMenuRecurs(a,roots[i], content, bg, 0);
		}
		
		//alert("finish buildMenusFromBookmarks");
	},
	
	buildMenuRecurs: function(ancestors, node, content, parent, depth){	
		//if(depth>2)return;
		//alert("depth for "+node +" is "+depth);
		var menu=sdeliciousMain.createMenu(node);
		parent.appendChild(menu);
		var  v=content[node];
		
		for(var i=0;i<v.length;i++){
			var subMenuItem=sdeliciousMain.createMenuItem({label:v[i].description, value:v[i].href, tooltip:v[i].href, statusText:v[i].href});
			subMenuItem.setAttribute("contextmenu","clipmenu");
			subMenuItem.addEventListener("click",sdeliciousMain.bookmarkClicked, false);
			//subMenuItem.setAttribute("onclick","sdeliciousMain.bookmarkClicked(event);");
			menu.firstChild.appendChild(subMenuItem);
		}
		
		
		if( !(v.siblings instanceof Array ))return;
		if(depth >0)return;
		
		//alert("create siblings for "+node);

		for(var i=0;i<v.siblings.length;i++){
			//alert("current sib2 is "+v.siblings[i]);
			if(v.siblings[i]==node)continue;
			if(Util.contains(ancestors,v.siblings[i]))continue;
			
			//alert("current sib2 is "+v.siblings[i]);
			ancestors.push(node);						
			sdeliciousMain.buildMenuRecurs(ancestors,v.siblings[i], content, menu.firstChild, depth+1);
			Util.remove(ancestors,node);				
		
		}
		
	},
	
	stopCheckTagsLoadingProgress:function(){
		//Util.log("clear tagsLoading "+sdeliciousMain.tagsLoadingProgressId);
		clearInterval(sdeliciousMain.tagsLoadingProgressId);
		sdeliciousMain.tagsLoadingProgressId=-1;
	},
	showBookmarksMenu:function(){
		var menu=document.getElementById("simple_delicious-menu");
		//alert("menu is "+menu.popup);
		//menu.doCommand();
	
		
		
	},
	getHiddenWindow:function(data){
		try{
		var hiddenWindow = Components.classes["@mozilla.org/appshell/appShellService;1"]
         .getService(Components.interfaces.nsIAppShellService)
         .hiddenDOMWindow;
		 /*
		hiddenWindow.Components.classes["@mozilla.org/moz/jssubscript-loader;1"]
         .getService(Components.interfaces.mozIJSSubScriptLoader)
         .loadSubScript("chrome://my-extension/content/globalObject.js");
		*/
		//hiddenWindow.myExtensionObject.doSomething();
		return hiddenWindow;
		}catch(ex){
			Util.log(ex+"");
		}
		return null;
	},
	
	updateGlobalData:function(data){
		try{
			/*
		var myService =  Components.classes["@topdogster.com/SDs;1"]
         .getService(Components.interfaces.nsISupports).wrappedJSObject;
		 myService.setData(data);
		alert(myService.getData());
		*/
			
			var win=sdeliciousMain.getHiddenWindow();
			if(win==null){
				sdeliciousMain.posts=data[0];
				sdeliciousMain.tags=data[1];
				sdeliciousMain.lastRetrieveTime = new Date();	
			}
			else{
				win.data=data;
				win.data.lastRetrieveTime = new Date();
				Util.log("updateGlobalData! "+win.data.lastRetrieveTime);
			}
		}catch(ex){
			Util.log("In updateGlobalData: " +ex+"");
		}
	},
	getGlobalData:function(){
			var win=sdeliciousMain.getHiddenWindow();
			Util.log("in load GlobalData hidden window is "+win);
			
			if(win==null || win.data==null)return null;
			Util.log("data is "+win.data[0]);

			return win.data;
				
	},
	
   updateMenuTags: function (){
   	Util.log("updateMenuTgas");
   	sdeliciousMain.tagsLoading=true;
	sdeliciousMain.checkTagsLoadingProgress();
 	try{
	var req = new XMLHttpRequest();
  	
 	req.onreadystatechange = function()
  	{	
    	if(req.readyState == 4)
   		{
       		if(req.status == 200){
				var postArray=req.responseXML.getElementsByTagName("post");
				var data=sdeliciousMain.parseResponseData(postArray);
				
				sdeliciousMain.buildBookmarks(data[0],data[1]);
				sdeliciousMain.showHardMenu();
			
				//update global data
				sdeliciousMain.updateGlobalData(data);
				sdeliciousMain.tagsLoading=false;
				//Util.log("set tagsLoading to "+sdeliciousMain.tagsLoading);
				//setTimeout("sdeliciousMain.stopCheckTagsLoadingProgress();",100)
	
						//store login from authManager to pref, this is to ensure that the correct login gets stored to pref(in case the user entered the wrong login into the prompt box the first time
						
						// var authUser=sdeliciousMain.loadUserFromAuthManager("https://api.del.icio.us/v1/posts/all?meta=1&results=100000");
						var authUser=sdeliciousMain.loadUserFromAuthManager(sdeliciousMain.ALL_API);						
						if(defined(authUser) && defined(authUser.username) && defined(authUser.password) && isString(authUser.username) && isString(authUser.password)){
							
							Util.log("in menuTagsUpdate store user "+authUser.username+","+authUser.password);
							//sdeliciousMain.storeUserToPref(authUser);
							sdeliciousMain.storeUser(authUser);
						}
					
				
			}
			else{
           		
				sdeliciousMain.tagsLoading=false;
  				alert("error: You must enter your login information.");
			}
		}
		
	};
	
	

	var user=sdeliciousMain.getUser();
		var username=null;
		var password=null;
		if(defined(user)){
			username=user.username;
			password=user.password;
		}
		
		Util.log("updateMenuTags send with "+username+","+password);
		req.open("POST", sdeliciousMain.ALL_API+"?results=500000&start=0&meta=1&src=ffbmext1.3.82", true);
		if(defined(username) && defined(password)){
			req.setRequestHeader('Authorization', 'basic ' + Util.base64(username + ':' + password));

		}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");  
		req.setRequestHeader('User-Agent', 'ffbmext1.3.82');
		req.send(null);
	
	//assume retrieveTime is sendTime
	//sdeliciousMain.lastRetrieveTime = new Date();
	
	}catch(e){
		sdeliciousMain.tagsLoading=false;
	}
   	return;
   },

   //ensure the status is setup properly
   updateMenuItems : function(){
       
        //in case the use clear the cookies
        var user = this.getUser();
	
        if(user)
          this.setUser(user);
        else
          this.setUser();
      
        var bundle = document.getElementById("bundle_simpledelicious");
        
        var statusItem = document.getElementById("del-menu-loginStatus");
        var elem = ["del-menu-myDelicious","del-menu-inbox","del-menu-for","del-menu-mySettings"];
  
        if(user){
          statusItem.setAttribute("label", document.getElementById("bundle_simpledelicious").getString("del_logout"));
  	  for(var i=0; i<elem.length; i++)
  	  	document.getElementById(elem[i]).removeAttribute("disabled");
        }	
        else{	
          statusItem.setAttribute("label", document.getElementById("bundle_simpledelicious").getString("del_login"));
  	  for(var i=0; i<elem.length; i++)
	    document.getElementById(elem[i]).setAttribute("disabled", true);
        }
        
        //notify other window instances to update login status
	Components.classes["@mozilla.org/observer-service;1"]
		 .getService(Components.interfaces.nsIObserverService)
	      	         .notifyObservers(null, "delicious:update-login-status", user);      
   },

   hideMenu : function(){
       
      var bundle = document.getElementById("bundle_simpledelicious");

      var prompts = Components.classes["@mozilla.org/embedcomp/prompt-service;1"]
                        .getService(Components.interfaces.nsIPromptService);
      var check = {value: false};
      var flags = prompts.STD_YES_NO_BUTTONS;
      var button = prompts.confirmEx(window, bundle.getString("del_hideMenuWindowTitle"), bundle.getString("del_hideMenuWarning"), flags, 
             null, null, null, null, check);
      if(button==0){

       //set menu hidden in default pref file
       this.setMenuHiddenInPref();

       //notify other window instances to hide menu
       Components.classes["@mozilla.org/observer-service;1"]
         		 .getService(Components.interfaces.nsIObserverService)
         	         .notifyObservers(null, "delicious:hide-menu", "1");      
      }
   },   
   
   updateToolbarButtons : function(){
       
       var bundle = document.getElementById("bundle_simpledelicious");
       
       var deliciousButton = document.getElementById("del-button-delicious");
       if(deliciousButton){
          
          if(this.user)
              deliciousButton.setAttribute("tooltiptext", bundle.getString("del_mydelicious"));
          else
              deliciousButton.setAttribute("tooltiptext", bundle.getString("del_delicious"));
       }
   } ,
   
   resetMenuTags : function(){
   		this.posts=null;
		this.tags=null;
		this.lastRetrieveTime=null;
		
   },
   postDelete:function(){
   		if(defined(document.popupNode) && defined(document.popupNode.parentNode))document.popupNode.parentNode.hidePopup();
		sdeliciousMain.openMenu();
   },
   deleteMenuItem : function(el){
   		Util.log("this is "+el.tagName);
		var x=document.getElementById("clipmenu");
		Util.log("parent node  is "+x.parentNode.tagName);
		
   		var menu=document.getElementById("simple_delicious-menu");
		//menu.
		Util.log("menu val is "+menu.value);
		var popupNode=document.popupNode;
		
		Util.log("popupNode is "+popupNode);
		var url=popupNode.getAttribute("value");
		Util.log(url);
		var cmd= sdeliciousMain.DELETE_API + "?url="+encodeURIComponent(url)+"&src=ffbmext1.3.82";
		var req = new XMLHttpRequest();
		 req.onreadystatechange=function(){
		 	if(req.readyState==4){
				if(req.status==200){

					Util.log("success delete "+req.responseXML);
					//sdeliciousMain.needRefresh=1;
					setTimeout("sdeliciousMain.postDelete();",1000)
					
					
					//dpopup.hidePopup();
					//Util.log("dpopup is "+dpopup);
					
					//sdeliciousMain.resetMenuTags();
					
					//menu.click();
					//dpopup.showPopup(menu,-1,-1);
					//Util.log("men clicked");
					
				}
			}
		 
		 };
		 req.open("POST", cmd);
		 var user=sdeliciousMain.getUser();
		var username=null;
		var password=null;
		if(defined(user)){
			username=user.username;
			password=user.password;
		}
		
		if(defined(username) && defined(password)){
			Util.log("delete send ");
			req.setRequestHeader('Authorization', 'basic ' + Util.base64(username + ':' + password));
			 
  			
		}
		req.setRequestHeader("Content-Type", "application/x-www-form-urlencoded");
		req.setRequestHeader('User-Agent', 'ffbmext1.3.82'); 
   		req.send(null);		
   }  
}

var deliciousObserver = {

  observe : function(aSubject, aTopic, aData){
  
     switch(aTopic){
        case "delicious:update-login-status":
	   //sdeliciousMain.user = aData; //this breaks!
	  // alert("set user to "+aData);
	 
           sdeliciousMain.updateToolbarButtons();
        break;
        case "delicious:hide-menu":
   	    var menu = document.getElementById("simple_delicious-menu");
            if(menu){
              if(aData=="1"){
   	         menu.setAttribute("hidden", true);
   	       }
   	       else{
   	         menu.removeAttribute("hidden");
   	       }
   	    }   
        break;
		case "delicious:update-post":
			
			//Util.log("aData is "+aData);
			//Util.log('update-post '+aData.length);
			//inspect(aData);
			//sdeliciousMain.buildBookmarks(aData);
			//sdeliciousMain.showHardMenu();
		break;
		
     }     
  }
}

var deliciousContextMenu = {

   register : function(){
  
     var menu = document.getElementById("contentAreaContextMenu");
     if(menu){
         menu.addEventListener("popupshowing", deliciousContextMenu.setup, false);
     }
   
     //hidden menuitems
     document.getElementById("del-context-tagCurrent-aftersearch").hidden = true;
     document.getElementById("del-context-tagCurrent").hidden = true;
     document.getElementById("del-context-tagLink").hidden = true;     
   },
      
   unregister : function(){
   
     var menu = document.getElementById("contentAreaContextMenu");
     if(menu){
         menu.removeEventListener("popupshowing", deliciousContextMenu.setup, false);
     }
     
     //hidden menuitems
     document.getElementById("del-context-tagCurrent-aftersearch").hidden = true;     
     document.getElementById("del-context-tagCurrent").hidden = true;
     document.getElementById("del-context-tagLink").hidden = true;
   },
   
   setup : function(){
   
       if(gContextMenu){
         
         gContextMenu.showItem("del-context-tagCurrent-aftersearch",  gContextMenu.isTextSelected);
         gContextMenu.showItem("del-context-tagCurrent",  !gContextMenu.isTextSelected && !( gContextMenu.isContentSelected || gContextMenu.onTextInput || gContextMenu.onLink || gContextMenu.onImage ));
         gContextMenu.showItem("del-context-tagLink", gContextMenu.onLink && !gContextMenu.onMailtoLink );
       }
   } 
}

var sdeliciousProgressListener = {

    onLocationChange: function(aWebProgress, aRequest, aURI) {
    	return 0;
    },
    
    onStateChange: function(aWebProgress, aRequest, aStateFlags, aStatus) { 
    	const nsIChannel = Components.interfaces.nsIChannel;
    	const nsIWebProgressListener = Components.interfaces.nsIWebProgressListener;
		
    	if(aStateFlags & nsIWebProgressListener.STATE_STOP) {
    		
	     if (aRequest) {
			     
        	var channel;
        	try { channel = aRequest.QueryInterface(nsIChannel);} catch(e) { };
        	if (channel) {
	
        	    var URI = channel.URI;		
        	    if(URI.spec.indexOf("del.icio.us")>-1){
        	    
        	       var user = sdeliciousMain.getUser();
				  
        	       if(user){
				   	
        	         sdeliciousMain.setUser(user);
        	       }  
        	       else{
				   	//alert("set user to null");
        	         sdeliciousMain.setUser();
        	       }  
        	      
		      //notify other window instances to update login status
	  	     Components.classes["@mozilla.org/observer-service;1"]
			 .getService(Components.interfaces.nsIObserverService)
	      		         .notifyObservers(null, "delicious:update-login-status", user); //progresslistener
        	    }
             	}
             }	
	}

    	return 0;     
    },
    
    onProgressChange: function(aWebProgress, aRequest,
                               aCurSelfProgress, aMaxSelfProgress,
                               aCurTotalProgress, aMaxTotalProgress) { 
    	return 0; 
    },
    
    onStatusChange: function(aWebProgress, aRequest, aStatus, aMessage) { 

    	return 0; 
    },
    
    onSecurityChange: function(aWebProgress, aRequest, aState) {     

    	return 0; 
    },
    
    onLinkIconAvailable: function() { 

    	return 0; 
    },
    
    QueryInterface: function(aIID) {
    	if (aIID.equals(Components.interfaces.nsIWebProgressListener) ||
	        aIID.equals(Components.interfaces.nsISupportsWeakReference) ||
    	    aIID.equals(Components.interfaces.nsISupports))
    		return this;
    	throw Components.results.NS_NOINTERFACE;
    }
}

function registerSDeliciousProgressListener() {
	
    window.getBrowser().addProgressListener(sdeliciousProgressListener, Components.interfaces.nsIWebProgress.NOTIFY_STATE_ALL);
}

function unregisterSDeliciousProgressListener(){
    window.getBrowser().removeProgressListener(sdeliciousProgressListener);
}

//init main
//window.addEventListener("load", sdeliciousMain.init, false);
//window.addEventListener("unload", sdeliciousMain.uninit, false);
window.addEventListener("load", sdeliciousMain.patchPref, false);