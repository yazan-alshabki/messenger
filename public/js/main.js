(function ($) {
  "use strict";

  let fullHeight = function () {
    $(".js-fullheight").css("height", $(window).height());
    $(window).resize(function () {
      $(".js-fullheight").css("height", $(window).height());
    });
  };
  fullHeight();

  $("#sidebarCollapse").on("click", function () {
    $("#sidebar").toggleClass("active");
  });
})(jQuery);

///////////////////////////////////////////////////////////// start dynamic app script
function getCookie(name) {
  let matches = document.cookie.match(
    new RegExp(
      "(?:^|; )" +
      name.replace(/([\.$?*|{}\(\)\[\]\\\/\+^])/g, "\\$1") +
      "=([^;]*)"
    )
  );
  return matches ? decodeURIComponent(matches[1]) : undefined;
}

//////////////  script socket.io ///////////////////////////////////////////////////
const userData = JSON.parse(getCookie("user"));

let sender_id = userData._id;
let receiver_id;
let global_group_id;
let socket = io("/user-namespace", {
  auth: {
    token: userData._id
  }
});

let userList = document.querySelectorAll(".user-list");
userList.forEach(function (user) {
  user.addEventListener("click", function () {
    let userId = this.getAttribute("data-id");
    receiver_id = userId;

    let startHead = document.querySelector(".start-head");
    let chatSection = document.querySelector(".chat-section");
    startHead.style.display = "none";
    chatSection.style.display = "block";
    socket.emit("existChat", {
      sender_id: sender_id,
      receiver_id: receiver_id
    });
  });
});

// update user online status
socket.on("getOnlineUser", function (data) {
  let element = document.getElementById(data.user_id + "-status");
  if (element) {
    element.textContent = "Online";
    element.classList.remove("offline-status");
    element.classList.add("online-status");
  }
});

socket.on("getOfflineUser", async function (data) {
  let element = document.getElementById(data.user_id + "-status");
  if (element) {
    element.textContent = "Offline";
    element.classList.remove("online-status");
    element.classList.add("offline-status");
  }
});

// chat save of user

document
  .getElementById("chat-form")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    let message = document.getElementById("message").value;
    let data = {
      sender_id: sender_id,
      receiver_id: receiver_id,
      message: message
    };

    const response = await fetch("/save-chat", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      document.getElementById("message").value = "";
      let chat = result.data.message;
      let html =
        `
	  <div class="current-user-chat" id='` +
        result.data._id +
        `'>
		<h5><span>` +
        chat +
        `</span>
		  <i class="fa fa-trash" aria-hidden="true" data-id='` +
        result.data._id +
        `' data-toggle = "modal" data-target="#deleteChatModal"></i>    
		  <i class="fa fa-edit" aria-hidden="true" data-msg='` +
        chat +
        `' data-id='` +
        result.data._id +
        `' data-toggle = "modal" data-target="#editChatModal"></i>    
		  
		  </h5>
	  </div>
	`;
      document
        .getElementById("chat-container")
        ?.appendChild(document.createRange().createContextualFragment(html));
      socket.emit("newChat", result.data);
      scrollChat();
    } else {
      alert(result.data.message);
    }
  });

socket.on("loadNewChat", function (data) {
  if (sender_id == data.receiver_id && receiver_id == data.sender_id) {
    let html =
      `
	<div class="distance-user-chat" id='` +
      data._id +
      `'>
			<h5>` +
      data.message +
      `
			</h5>
		</div>
	`;
    document
      .getElementById("chat-container")
      ?.appendChild(document.createRange().createContextualFragment(html));
  }
  scrollChat();
});

// load chats
socket.on("loadChats", function (data) {
  document.getElementById("chat-container").innerHTML = "";
  let chats = data.chats;
  let html = ``;
  for (let i = 0; i < chats.length; i++) {
    let addClass = "";
    if (chats[i]["sender_id"] == sender_id) {
      addClass = "current-user-chat";
    } else {
      addClass = "distance-user-chat";
    }
    let html =
      `
	<div class='` +
      addClass +
      `' id='` +
      chats[i]["_id"] +
      `'>  
			<h5><span>` +
      chats[i]["message"] +
      `</span>`;

    if (chats[i]["sender_id"] == sender_id) {
      html +=
        `<i class="fa fa-trash" aria-hidden="true" data-id='` +
        chats[i]["_id"] +
        `' data-toggle = "modal" data-target="#deleteChatModal"></i>
		  <i class="fa fa-edit" aria-hidden="true" data-msg='` +
        chats[i]["message"] +
        `' data-id='` +
        chats[i]["_id"] +
        `' data-toggle = "modal" data-target="#editChatModal"></i>    

		  `;
    }
    html += `  
			</h5>
		</div>
	  `;

    document
      .getElementById("chat-container")
      ?.appendChild(document.createRange().createContextualFragment(html));
  }
  scrollChat();
});

function scrollChat() {
  const chatContainer = document.getElementById("chat-container");
  chatContainer.scrollTop =
    chatContainer.offsetTop + chatContainer.scrollHeight;
}


// delete chat work
$(document).on("click", ".fa-trash", function () {
  let msg = $(this).parent().text();
  $("#delete-message").text(msg);
  $("#delete-message-id").val($(this).attr("data-id"));
});

document
  .getElementById("delete-chat-form")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const id = document.getElementById("delete-message-id").value;
    try {
      const response = await fetch("/delete-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id })
      });

      const res = await response.json();
      if (res.success) {
        document.getElementById(id).remove();
        document.getElementById("deleteChatModal").classList.remove("show");
        document
          .getElementById("deleteChatModal")
          .setAttribute("aria-hidden", "true");
        socket.emit("chatDeleted", id);

        $("#" + id).remove();
        $("#deleteChatModal").modal("hide");
        socket.emit("chatDeleted", id);
      } else {
        alert(res.msg);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  });

socket.on("chatMessageDeleted", function (id) {
  $("#" + id).remove();
});

// update user chat work
$(document).on("click", ".fa-edit", function () {
  $("#edit-message-id").val($(this).attr("data-id"));
  $("#update-message").val($(this).attr("data-msg"));
});

// update
document
  .getElementById("update-chat-form")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    const id = document.getElementById("edit-message-id").value;
    const msg = document.getElementById("update-message").value;

    try {
      const response = await fetch("/update-chat", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ id: id, message: msg })
      });

      const res = await response.json();
      if (res.success) {
        $("#editChatModal").modal("hide");
        $("#" + id).find("span").text(msg);
        $("#" + id).find(".fa-edit").attr("data-msg", msg);

        socket.emit("chatUpdated", { id: id, message: msg });
      } else {
        alert(res.msg);
      }
    } catch (error) {
      console.error("Error deleting chat:", error);
    }
  });

// chat updated
socket.on("chatMessageUpdated", function (data) {
  $("#" + data.id).find("span").text(data.message);
});

//////////////////////////////////////////////////
// add member js
$(".addMember").click(async function () {
  let id = $(this).attr("data-id");
  let limit = $(this).attr("data-limit");
  $("#group_id").val(id);
  $("#limit").val(limit);
  let data = {
    group_id: id
  };
  const response = await fetch("/get-members", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.success) {
    console.log(result);
    let users = result.data;
    let html = "";
    for (let i = 0; i < users.length; i++) {
      let isMemberOfGroup = users[i]["member"].length > 0 ? true : false;
      console.log(isMemberOfGroup);
      html +=
        `
        <tr>
          <td> <input type="checkbox"` +
        (isMemberOfGroup ? "checked" : "") +
        ` name="members[]" value="` +
        users[i]["_id"] +
        `"/></td>
          <td>` +
        users[i]["firstName"] + " "
      users[i]["lastName"] +
        `</td>
        </tr>
      `;
    }
    $(".addMemberTable").html(html);
  } else {
  }
});

// add members from submit code

document
  .getElementById("add-member-form")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    let data = {};
    let formData = new FormData(this);
    for (let [key, value] of formData.entries()) {
      data[key] = value;
    }
    const selectedMembers = Array.from(formData.getAll("members[]"));
    data["members"] = selectedMembers;

    const response = await fetch("/add-members", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    console.log(result);
    if (result.success) {
      $("#memberModal").modal("hide");
      document.getElementById("add-member-form").reset();
      alert(result.msg);
    } else {
      $("#add-member-error").text(result.msg);
      setTimeout(function () {
        $("#add-member-error").text("");
      }, 3000);
    }
  });

// update group script
$(".updateMember").click(function () {
  let obj = JSON.parse($(this).attr("data-obj"));
  $("#update_group_id").val(obj._id);
  $("#last_limit").val(obj.limit);
  $("#group_name").val(obj.name);
  $("#group_limit").val(obj.limit);
});

$("#updateChatGroupForm").submit(async function (event) {
  event.preventDefault();
  let formData = new FormData(this);

  const response = await fetch("/update-chat-group", {
    method: "POST",
    body: formData
  });
  const result = await response.json();
  console.log(result);
  if (result.success) {
    alert(result.msg);
    location.reload();
  } else {
  }
});

////////////      delete group
$(".deleteGroup").click(function () {
  $("#delete_group_id").val($(this).attr("data-id"));
  $("#delete_group_name").text($(this).attr("data-name"));
});

$("#deleteChatGroupForm").submit(async function (e) {
  event.preventDefault();
  let data = {};
  let formData = new FormData(this);
  for (let [key, value] of formData.entries()) {
    data[key] = value;
  }
  const response = await fetch("/delete-chat-group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  console.log(result);
  if (result.success) {
    location.reload();
  } else {
  }
});

// copy sharable link
$(".copy").click(function () {
  $(this).prepend('<span class="copied_text">Copied</span>');
  let group_id = $(this).attr("data-id");
  let url = window.location.host + "/share-group/" + group_id;

  let temp = $("<input>");
  $("body").append(temp);
  temp.val(url).select();
  document.execCommand("copy");
  temp.remove();

  setTimeout(() => {
    $(".copied_text").remove();
  }, 2000);
});

// join group script
$(".join-now").click(async function () {
  $(this).text("Wait... ");
  $(this).attr("disabled", "disabled");
  let group_id = $(this).attr("data-id");
  let data = {
    group_id: group_id
  };
  const response = await fetch("/join-group", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.success) {
    location.reload();
  } else {
    alert(result.msg);
    $(this).text("Join now");
    $(this).removeAttr("disabled");
  }
});


/////////////// group chat script

function scrollGroupChat() {
  const chatContainer = document.getElementById("group-chat-container");
  chatContainer.scrollTop =
    chatContainer.offsetTop + chatContainer.scrollHeight;
}


$('.group-list').click(function () {
  $('.group-start-head').hide();
  $('.group-chat-section').show();
  global_group_id = $(this).attr('data-id');
  loadGroupChats();
})

///// save chat in group
document
  .getElementById("group-chat-form")
  ?.addEventListener("submit", async function (event) {
    event.preventDefault();
    let message = document.getElementById("group-message").value;
    let data = {
      sender_id: sender_id,
      group_id: global_group_id,
      message: message
    };
    const response = await fetch("/group-chat-save", {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(data)
    });
    const result = await response.json();
    if (result.success) {
      console.log(result.chat);

      document.getElementById("group-message").value = "";
      let message = result.chat.message;
      let html = `
        <div class="current-user-chat" id='`+ result.chat._id + `'>
                <h5>
                  <span>` + message + `</span>

                  <i class="fa fa-trash deleteGroupChat" aria-hidden="true" 
                  data-id='`+ result.chat._id + `' 
                  data-toggle = "modal" data-target="#deleteGroupChatModal">
                  </i>    

                  <i class="fa fa-edit editGroupChat" aria-hidden="true" 
                  data-id='`+ result.chat._id + `'
                  data-msg='`+ message + `'
                  data-toggle = "modal" data-target="#editGroupChatModal">
                  </i>`;

      html += `
      </h5>`;
      var date = new Date(result.chat.createdAt);
      var cDate = date.getDate();
      var cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1);
      var cYear = date.getFullYear();
      let getFullDate = cDate + ' - ' + cMonth + ' - ' + cYear;
      html += `
          <div class="user-data"><b>Me : </b>`+ getFullDate + `</div>
        </div>
      `;



      document
        .getElementById("group-chat-container")
        ?.appendChild(document.createRange().createContextualFragment(html));
      socket.emit("newGroupChat", result.chat);

      scrollGroupChat();
    } else {
      alert(result.data.message);
    }
  });

socket.on('loadNewGroupChat', function (data) {
  if (global_group_id == data.group_id) {
    let html = `
      <div class="distance-user-chat" id='`+ data._id + `'>
              <h5>
                <span>` + data.message + `</span>`;
    html += `</h5>`;
    var date = new Date(data.createdAt);
    var cDate = date.getDate();
    var cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1);
    var cYear = date.getFullYear();
    let getFullDate = cDate + ' - ' + cMonth + ' - ' + cYear;
    html += `
      <div class="user-data">
        <img src="`+ data.sender_id.photo + `" class="user-chat-image"/>

        <b>`+ data.sender_id.firstName + " " + data.sender_id.lastName + ` : </b>`
      + getFullDate +
      `</div> </div>`;

    document
      .getElementById("group-chat-container")
      ?.appendChild(document.createRange().createContextualFragment(html));
    scrollGroupChat();

  }


})



async function loadGroupChats() {
  document.getElementById("group-chat-container").innerHTML = "";
  const data = {
    group_id: global_group_id
  };

  const response = await fetch("/load-group-chats", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.success) {

    document.getElementById("group-chat-container").innerHTML = "";
    let chats = result.chats;
    let html = ``;
    for (let i = 0; i < chats.length; i++) {
      let addClass = "";
      if (chats[i]["sender_id"]._id == sender_id) {
        addClass = "current-user-chat";
      } else {
        addClass = "distance-user-chat";
      }
      html += `
          <div class="`+ addClass + `" id='` + chats[i]['_id'] + `'>
                <h5>
                  <span>` + chats[i]['message'] + `</span>`;
      if (chats[i]["sender_id"]._id == sender_id) {

        html += `
                            <i class="fa fa-trash deleteGroupChat" aria-hidden="true" 
                              data-id='`+ chats[i]['_id'] + `' 
                              data-toggle = "modal" 
                              data-target="#deleteGroupChatModal">
                            </i>
                            <i class="fa fa-edit editGroupChat" aria-hidden="true" 
                              data-id='`+ chats[i]['_id'] + `'
                              data-msg='`+ chats[i]['message'] + `'
                              data-toggle = "modal" data-target="#editGroupChatModal">
                            </i>
                            `;
      }

      html += `
                        </h5>`;
      var date = new Date(chats[i]["createdAt"]);
      var cDate = date.getDate();
      var cMonth = (date.getMonth() + 1) > 9 ? (date.getMonth() + 1) : "0" + (date.getMonth() + 1);
      var cYear = date.getFullYear();
      let getFullDate = cDate + ' - ' + cMonth + ' - ' + cYear;
      if (chats[i]["sender_id"]._id == sender_id) {
        html += `
              <div class="user-data"><b>Me : </b>`+ getFullDate + `</div>
        `;
      } else {
        html += `
        <div class="user-data">
          <img src="`+ chats[i]['sender_id'].photo + `" class="user-chat-image"/>

          <b>`+ chats[i]['sender_id'].firstName + " " + chats[i]['sender_id'].lastName + ` : </b>`
          + getFullDate +
          `</div>`;
      }

      html += `
      
                  </div>
            
                  `;




    }
    document
      .getElementById("group-chat-container")
      ?.appendChild(document.createRange().createContextualFragment(html));
    scrollGroupChat();


  } else {
    alert(result.msg);
  }

}

$(document).on('click', '.deleteGroupChat', function () {
  let msg = $(this).parent().find('span').text();
  $('#delete-group-message').text(msg);
  $('#delete-group-message-id').val($(this).attr('data-id'));
})

$('#delete-group-chat-form').submit(async function (e) {
  e.preventDefault();
  let id = $('#delete-group-message-id').val();

  const data = {
    id: id
  };
  const response = await fetch("/delete-group-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.success) {

    document.getElementById(id).remove();
    document.getElementById("deleteGroupChatModal").classList.remove("show");
    document.getElementById("deleteGroupChatModal").setAttribute("aria-hidden", "true");
    $('#' + id).remove();
    $('#deleteGroupChatModal').modal('hide');
    socket.emit('groupChatDeleted', id);
  } else {
    alert(result.msg);
  }
})

// listen to deleted chat 
socket.on("groupChatMessageDeleted", function (id) {
  $('#' + id).remove();
})


// update chat message 
$(document).on('click', '.editGroupChat', function () {

  $('#edit-group-message-id').val($(this).attr('data-id'));
  $('#update-group-message').val($(this).attr('data-msg'));

})

$('#update-group-chat-form').submit(async function (e) {
  e.preventDefault();
  let id = $('#edit-group-message-id').val();
  let msg = $('#update-group-message').val();

  const data = {
    id: id,
    message: msg
  };
  const response = await fetch("/update-group-chat", {
    method: "POST",
    headers: {
      "Content-Type": "application/json"
    },
    body: JSON.stringify(data)
  });
  const result = await response.json();
  if (result.success) {

    $('#editGroupChatModal').modal('hide');
    $('#' + id).find('span').text(msg);
    $('#' + id).find('.editGroupChat').attr('data-msg', msg);
    socket.emit('groupChatUpdated', { id: id, message: msg });

  } else {
    alert(result.msg);
  }
})


// load updated chat
socket.on('groupChatMessageUpdated', function (data) {
  $('#' + data.id).find('span').text(data.message);
})

