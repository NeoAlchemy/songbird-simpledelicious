
function startup(){
/*
   var showMenuRadioGroup = document.getElementById("showMenuRadioGroup");
   var pref = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
   try{
       var bool = pref.getBoolPref("delicious.menu.hidden");
       if(bool){
         document.getElementById("hideMenuRadio").setAttribute("selected", true);
         showMenuRadioGroup.setAttribute("value", "1");
       }
       else{
         document.getElementById("showMenuRadio").setAttribute("selected", true);
         showMenuRadioGroup.setAttribute("value", "0");
       }
   }
   catch(e){
        document.getElementById("showMenuRadio").setAttribute("selected", true);
        showMenuRadioGroup.setAttribute("value", "0");
        pref.setBoolPref("delicious.menu.hidden", false);
   }
   */

  loadAccountInfo();

}
function loadAccountInfo(){
	var user=sdeliciousMain.loadUser();
	if(!defined(user)) user = sdeliciousMain.loadUserFromAuthManagerAnyAPI();
	if(defined(user) && defined(user.username) && defined(user.password)){
		var userBox=document.getElementById("userName");
		var passBox=document.getElementById("password");
		userBox.value=user.username;
		passBox.value=user.password;
	}
	
}
function loadAccountInfoFromPref(){
 	try{
	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
	prefs = prefs.getBranch("extensions.simpleDelicious.");
	
	var userName=null;
	var password=null;
	if(prefs.prefHasUserValue("userName")){
		userName=prefs.getCharPref("userName");
		
	}
	if(prefs.prefHasUserValue("password")){
		password=prefs.getCharPref("password");
		
	}
	
	var userBox=document.getElementById("userName");
	var passBox=document.getElementById("password");
	if(userName!=null)userBox.value=userName;
	if(password!=null)passBox.value=password;
	
	}catch(e){
		Util.log(e+"");
	}
}
function clearAccountInfoFromPref(){

 	var prefs = Components.classes["@mozilla.org/preferences-service;1"].
                    getService(Components.interfaces.nsIPrefService);
	prefs = prefs.getBranch("extensions.simpleDelicious.");
	
	if(prefs.prefHasUserValue("userName")){
		
		prefs.clearUserPref("userName");
	}
	if(prefs.prefHasUserValue("password"))prefs.clearUserPref("password");
	
	
	var userName="";
	var password="";
	if(prefs.prefHasUserValue("userName")){
		userName=prefs.getCharPref("userName");
		
	}
	if(prefs.prefHasUserValue("password")){
		password=prefs.getCharPref("password");
		
	}

	var userBox=document.getElementById("userName");
	var passBox=document.getElementById("password");
	if(userName!=null)userBox.value=userName;
	if(password!=null)passBox.value=password;
	
}
function clearAccountInfo(){
	var userBox=document.getElementById("userName");
	var passBox=document.getElementById("password");
	//var user={};
	//user.username=userBox.value;
	//user.password=userBox.value;
	sdeliciousMain.clearUsers();
	sdeliciousMain.clearUsersFromAuthManagerAllAPIs();
	
	userBox.value="";
	passBox.value="";
	sdeliciousMain.notifyLoginChange();
}
function cmdClear(){
	clearAccountInfo();
	
}


function toggleMenuVisibility(){
    
    var pref = Components.classes["@mozilla.org/preferences-service;1"]
			.getService(Components.interfaces.nsIPrefBranch);
			
    var option = document.getElementById("showMenuRadioGroup").getAttribute("value");
    if(option=="1"){
      pref.setBoolPref("delicious.menu.hidden", true);
    
      Components.classes["@mozilla.org/observer-service;1"]
	 .getService(Components.interfaces.nsIObserverService)
   	         .notifyObservers(null, "delicious:hide-menu", "1");      
    }
    else{    
      pref.setBoolPref("delicious.menu.hidden", false);
      
      Components.classes["@mozilla.org/observer-service;1"]
	 .getService(Components.interfaces.nsIObserverService)
   	         .notifyObservers(null, "delicious:hide-menu", "0");      
    }
    
    setTimeout("window.close()", 0);
}
function optionsHandleOK(box){
	saveOptions();
	box.close();
}
function saveOptions(){
	var userName=document.getElementById("userName").value;
	var password=document.getElementById("password").value;
	if(defined(userName) && defined(password)){
		var user={};
		user.username=userName;
		user.password=password;
		sdeliciousMain.setUser(user);
		sdeliciousMain.storeUser(user);
		sdeliciousMain.storeUserToAuthManagerAllAPIs(user);
		sdeliciousMain.notifyLoginChange();
		
	}
		
}
   function loadUserFromCookie() {
	
     var domain  = ".del.icio.us";
     var name    = "_user";
     var userName    = null;

     var cookieManager = Components.classes["@mozilla.org/cookiemanager;1"]
     				.getService(Components.interfaces.nsICookieManager); 
     var iter = cookieManager.enumerator; 
     while (iter.hasMoreElements()){ 
   
         var cookie = iter.getNext(); 
         if (cookie instanceof Components.interfaces.nsICookie){ 
                 if (cookie.host == domain && cookie.name == name){
                             userName = cookie.value.split(/%20/)[0];
							 
                 }; 
         } 
     }
	
	 if(userName==null)return null;
	var user=new Array();
	user.userName=userName;
	user.password=null;
    return user;
   }
