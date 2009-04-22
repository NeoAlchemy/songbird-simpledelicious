function openURL(aUrl){
  if ("@songbirdnest.com/faceplate/manager;1" in Components.classes) {
	 //for songbird
	 window.opener.openURL(aUrl)
  }
  else if("@mozilla.org/xre/app-info;1" in Components.classes)      
     return;
  else{
     //for pre 1.5 version
     window.opener.openURL(aUrl)  
  }
}  