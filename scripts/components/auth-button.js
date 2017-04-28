import events from "../events/events.js";
import fb from "../fb-wrapper.js";
import util from "../utils.js";

let {formatString: format} = util;

let providers = {
    google: new fb.firebase.auth.GoogleAuthProvider()
};

let user = null;

(function() {
    let isFirstCall = true;
    
    fb.auth.onAuthStateChanged((nUser) => {
        user = nUser;
        
        // Bleh...
        if (isFirstCall) {
            isFirstCall = false;
            if (user != null) {
                registerUser();
            }
        } else if (user != null) {
            Materialize.toast("Successfully logged in.", 2000);            
        } else {
            Materialize.toast("Successfuly logged out.", 2000);            
        }
    });
})();

function registerUser() {
    fb.db.ref(`/users/${user.uid}`).once("value", (snapshot) => {
        if (snapshot.exists()) {
            // Possibly update profile picture and stuff.
        } else {
            fb.db.ref(`/users/${user.uid}`).set({
                permission_level: 0,
                name: user.displayName,
                photo_url: user.photoURL
            }).catch((err) => {
                console.error(err);
            });
        }
    });
}

class AuthButton {
    constructor(el, {markup, provider}) {
        this.$el = $(el);
        this.markup = markup;
        this.provider = provider;
        
        this.$el.click(this.handleClick.bind(this));
        this.updateMarkup();
        
        fb.auth.onAuthStateChanged(this.updateMarkup.bind(this));
    }
    updateMarkup() {
        if (user != null) {
            this.$el.html(format(this.markup.auth, user));
        } else {
            this.$el.html(this.markup.noAuth);
        }
    }
    handleClick() {
        if (user == null) {
            fb.auth.signInWithPopup(providers[this.provider]).catch((err) => {
                Materialize.toast("An error occured whilst attempting to sign in.", 2000);
            });
        } else {
            fb.auth.signOut().catch((err) => {
                Materialize.toast("An error occured whilst attempting to sign out.", 2000);
            });
        }
    }
}

export default AuthButton;
