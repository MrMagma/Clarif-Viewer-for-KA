import fb from "./fb-wrapper.js";
import AuthButton from "./components/auth-button.js";
import events from "./events.js";
import {tag as tagCreator} from "./components/creators.js";

let $usersTable, permissions = null, permissionsData = null, tags = null;

fb.db.ref("/data/permissions").once("value", (snapshot) => {
    permissions = snapshot.val();
    
    console.log("permissions", permissions, permissionsData);
    if (permissions != null && permissionsData != null) {
        events.fire("permissions_loaded");
    }
});

fb.db.ref("/data/permission_data").once("value", (snapshot) => {
    permissionsData = snapshot.val();
    console.log("permissions_data", permissions, permissionsData);
    if (permissions != null && permissionsData != null) {
        events.fire("permissions_loaded");
    }
});

function handleErr(err) {
    if (err.code === "PERMISSION_DENIED") {
        Materialize.toast("You don't have permission to do that.", 2000);
    } else {
        Materialize.toast("An error occured while trying to set the permissions.", 2000);
        console.error(err);
    }
}

function addUserToTable(user, key) {
    let $select = $("<select>")
        .append(
            Object.keys(permissions)
                .filter(key =>
                    !permissionsData[key].internal
                    )
                .map(key =>
                    $("<option>")
                        .text(permissionsData[key].name)
                        .attr({
                            value: key,
                            selected: user.permission_level === permissions[key]
                        })
                    )
                );
    
    $select.change((evt) => {
        fb.db.ref(`users/${key}/permission_level`)
            .set(permissions[evt.target.selectedOptions[0].value])
            .catch(handleErr);
    });
    
    $usersTable.append(
        $("<tr>").append(
            $("<td>").append(
                $("<img>")
                    .addClass("circle cvka-profile-image")
                    .attr("src", user.photo_url)
            ),
            $("<td>").append(
                $("<span>")
                    .text(user.name)
            ),
            $("<td>").append(
                $select
            )
        )
    );
    
    $select.material_select();
}

function addToUsersTable(users) {
    for (let key in users) {
        if (users.hasOwnProperty(key)) {
            addUserToTable(users[key], key);
        }
    }
}

function initTag(tag) {
    let $deleteEl = $("<a>")
        .attr({
            href: "javascript: void(0);",
            "data-tooltip": "Click here to delete this tag."
        })
        .addClass("secondary-content black-text cvka-delete-icon")
        .append(
            $("<i>")
                .addClass("material-icons")
                .text("delete")
        )
        .tooltip({
            delay: 50,
            position: "bottom"
        });
    
    let $domNode = $("<li>")
        .addClass("collection-item")
        .append(
            tagCreator(tags[tag]),
            $deleteEl
        );
    
    $deleteEl.click((evt) => {
        fb.db.ref(`/data/tags/${tag}`).remove().then(() => {
            $domNode.css("display", "none");
        }).catch(handleErr);
    });
    
    return $domNode;
}

function initTags() {    
    $(".js-tags").append(Object.keys(tags).map(initTag));
}

$(document).ready(() => {
    new AuthButton(".js-auth-btn", {
        provider: "google",
        markup: {
            auth: "<span class='cvka-auth-message'>Hello {{displayName}}, click here to log out</span>",
            noAuth: "<span class='cvka-auth-message'>Hello Guest, click here to log in.</span>"
        }
    });
    
    $usersTable = $(".js-users");
    
    fb.db.ref("/users").once("value", (snapshot) => {
        if (permissions != null && permissionsData != null) {
            addToUsersTable(snapshot.val());
        } else {
            events.on("permissions_loaded",
                addToUsersTable.bind(addToUsersTable, snapshot.val()));
        }
    });
    
    fb.db.ref("/data/tags").once("value", (snapshot) => {
        tags = snapshot.val();
        initTags();
    });
});
