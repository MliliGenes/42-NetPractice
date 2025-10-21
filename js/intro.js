


function save_login()
{
    var login = document.getElementById('input_login').value;
    localStorage.setItem("g_my_login", login);
    if (login == '')
    {
	// Generate 3 random levels from 6 to 10 for evaluation mode
	var lvl1 = Math.round(6 + 4*Math.random());
	var lvl2 = Math.round(6 + 4*Math.random());
	var lvl3 = Math.round(6 + 4*Math.random());
	localStorage.setItem("g_my_eval", JSON.stringify([lvl1, lvl2, lvl3]));
	window.location = "level"+lvl1+".html";
    }
    else
	window.location = 'level1.html';
}


function load_login()
{
    var login;
    if (!(login = localStorage.getItem("g_my_login")))
        login = ''; // will means full random during sim.
    return (login);
}
