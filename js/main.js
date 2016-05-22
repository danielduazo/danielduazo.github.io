function get_email_link (link_title) {
	var username = "aaron";
	var hostname = "agundy.com";
	var link = username + "@" + hostname;
	link_title = link_title || link;
	document.write("<a href='" + "mail" + "to:" + link + "''>"+link_title + "</a>" )
}