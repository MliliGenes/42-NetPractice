
var g_sim_logs = '';
var g_my_login = 0;
var g_rand_prev;
var g_rand_repl = [];
var g_eval_lvls;
var g_goal_status = {}; // track last status/text per goal id


function my_console_log(str)
{
//    console.log(str);
}


function hash_login(login)
{
    var seed = 0;
    for (var i = 0; i < login.length; i ++)
    {
	if (i%2 == 0)
	    seed += 973 * (login.charCodeAt(i)+i);
	else
	    seed += 5 * login.charCodeAt(i) * i;
    }
//    console.log("hash login : '"+login+"' -> "+seed);
    return (seed);
}


function err(thetype, field)
{
    my_console_log("Fatal error in "+thetype+", on field "+field);
    throw '';
}


function my_random(a, b)
{
    if (g_my_login == '')
	return (Math.round(parseInt(a) + (parseInt(b)-parseInt(a))*Math.random()));
    var prev = g_rand_prev;
    prev ^= prev << 13;
    prev ^= prev >> 17;
    prev ^= prev << 5;
    g_rand_prev = prev;
    prev = (prev & 0x7FFFFFFF) % (parseInt(b)-parseInt(a)+1);
    return (Math.round(parseInt(a) + prev));
}

function random_repl(str)
{
    var regex = /\[(\d+)-(\d+)\]([a-z])/g;
    var res;
    var str2 = str;
    while (res = regex.exec(str))
    {
	my_console_log(res);
	g_rand_repl[res[3]] = my_random(res[1], res[2]);
	str2 = str2.replace(res[0], ""+g_rand_repl[res[3]]);
	my_console_log(str2);
    }
    regex = /\[([a-z])\]/g;
    while (res = regex.exec(str))
    {
	my_console_log(res);
	if (g_rand_repl[res[1]] != null)
	{
	    str2 = str2.replace(res[0], ""+g_rand_repl[res[1]]);
	    my_console_log(str2);
	}
	else
	    return (null);
    }

    if (str2 == "default") return (str2);
    // check if any non digital, non dot, non slash char, except previous line
    regex = /[^\d\.\/]/g;
    if (regex.exec(str2))
	return (null);
    
    return (str2);
}

function show_host(root, h)
{
    if (!h['id']) err("hosts", "id");
    if (!h['type']) err("hosts id "+h['id'], "type");
    if (!h['name']) err("hosts id "+h['id'], "name");
    if (!h['geometry']) err("hosts id "+h['id'], "geometry");
    if (!h['img']) err("hosts id "+h['id'], "img");

    var tab = h['geometry'].split(/[^0-9]+/);
    if (tab.length != 4) err("hosts id "+h['id'], "geometry parsing");
    h['w'] = parseInt(tab[0]);
    h['h'] = parseInt(tab[1]);
    h['x'] = parseInt(tab[2]);
    h['y'] = parseInt(tab[3]);
    
    var newelem = document.createElement('div');
    newelem.className = 'host_div';
    newelem.style.position = "absolute";
    newelem.style.width = h['w']+'px';
    newelem.style.height = h['h']+'px';
    newelem.style.top = h['y'] + 'px';
    newelem.style.left = h['x'] + 'px';
    newelem.style.backgroundImage = 'url(img/'+h['img']+')';
    root.appendChild(newelem);

    // label + routes
    var tab = h['labelpos'].split(',');
    if (tab.length != 2) err("host id "+h['id'], "labelpos parsing");
    h['lx'] = parseInt(tab[0]);
    h['ly'] = parseInt(tab[1]);
    
    // Check for overlaps with interfaces and adjust routing table position
    var finalLx = h['lx'];
    var finalLy = h['ly'];
    var minDistance = 150; // Minimum distance from interface cards
    
    // Try to find a position that doesn't overlap with interfaces
    var labelOffsetOptions = [
        {x: 0, y: 0},          // Original
        {x: 0, y: 120},        // Below
        {x: 0, y: -120},       // Above
        {x: 200, y: 0},        // Right
        {x: -200, y: 0},       // Left
        {x: 200, y: 120},      // Bottom-right
        {x: -200, y: 120},     // Bottom-left
        {x: 200, y: -120},     // Top-right
        {x: -200, y: -120}     // Top-left
    ];
    
    var foundLabelPos = false;
    for (var i = 0; i < labelOffsetOptions.length && !foundLabelPos; i++) {
        var testLx = h['lx'] + labelOffsetOptions[i].x;
        var testLy = h['ly'] + labelOffsetOptions[i].y;
        var hasOverlap = false;
        
        // Check against all interfaces on this host
        ifs.forEach(function(itf) {
            if (itf['hid'] === h['id'] && itf['dx'] !== undefined && itf['dy'] !== undefined) {
                var distance = Math.sqrt(
                    Math.pow(testLx - itf['dx'], 2) + 
                    Math.pow(testLy - itf['dy'], 2)
                );
                
                if (distance < minDistance) {
                    hasOverlap = true;
                }
            }
        });
        
        if (!hasOverlap) {
            finalLx = testLx;
            finalLy = testLy;
            foundLabelPos = true;
        }
    }
    
    // Store final position on host object for later use
    h['finalLx'] = finalLx;
    h['finalLy'] = finalLy;

    var newelem = document.createElement('div');
    newelem.className = 'host_info_div';
    newelem.setAttribute('data-routing-table', 'true');
    newelem.setAttribute('data-host-id', h['id']);
    newelem.style.position = "absolute";
    newelem.style.top = (h['y']+finalLy)+'px';
    newelem.style.left = (h['x']+finalLx)+'px';
    var label = '<table><tr><td>'+h['type']+' '+h['id']+': <i>'+h['name']+'</id></td></tr>';
    var str = '';
    routes.forEach(r => {if (h['id'] == r['hid']) { str += '<tr><td>'+get_route_info(r)+'</td></tr>\n'; r['h'] = h;}});
    if (str != '') label += '<tr><td>Routes :</td></tr>\n'+str;
    label += '</table>';
    newelem.innerHTML = label;
    root.appendChild(newelem);
    
}



function get_route_info(r)
{
    if (!r['rid']) err("route", "rid");
    if (!r['hid']) err("route id "+r['rid'], "hid");
    if (!r['route']) err("route id "+r['rid'], "route");
    if (!r['route_edit']) err("route id "+r['rid'], "route_edit");
    if (!r['gate']) err("route id "+r['rid'], "gate");
    if (!r['gate_edit']) err("route id "+r['rid'], "gate_edit");

    if ((r['route'] = random_repl(r['route'])) == null) err("route id "+r['rid'], "route ip random syntax");
    if ((r['gate'] = random_repl(r['gate'])) == null) err("route id "+r['rid'], "gate random syntax");
    
    if (r['route_edit'] == 'true') route_active = ''; else route_active = 'disabled';
    if (r['gate_edit'] == 'true') gate_active = ''; else gate_active = 'disabled';
    var routestr = '<div style="display:flex;align-items:center;gap:6px;"><input size=13 type=text id=route_'+r['rid']+' value="'+r['route']+'" '+route_active+' style="flex:1;min-width:110px;"><span style="color:#64748b;">→</span><input size=13 type=text id=gate_'+r['rid']+' value="'+r['gate']+'" '+gate_active+' style="flex:1;min-width:110px;"></div>';
//    my_console_log("add label route : ##"+routestr);
    return (routestr);
}



function show_ifs(root, itf)
{
    if (!itf['if']) err("ifs", "if");
    if (!itf['hid']) err("ifs "+itf['if'], "hid");
    if (!itf['ip']) err("ifs "+itf['if'], "ip");
    if (!itf['mask']) err("ifs "+itf['if'], "mask");
    if (!itf['ip_edit']) err("ifs "+itf['if'], "ip_edit");
    if (!itf['mask_edit']) err("ifs "+itf['if'], "mask_edit");
    if (!itf['type']) err("ifs "+itf['if'], "type");
    if (!itf['pos']) err("ifs "+itf['if'], "pos");

    if ((itf['ip'] = random_repl(itf['ip'])) == null) err("ifs "+itf['if'], "ip random syntax");
    if ((itf['mask'] = random_repl(itf['mask'])) == null) err("ifs "+itf['if'], "mask random syntax");
    
    hosts.forEach(h => {if (itf['hid'] == h['id']) itf['h'] = h});

    var tab = itf['pos'].split(',');
    if (tab.length != 2) err("ifs id "+itf['if'], "pos parsing");
    
    // Parse base position
    var baseDx = parseInt(tab[0]);
    var baseDy = parseInt(tab[1]);
    
    // Improved overlap detection with better spacing
    var finalDx = baseDx;
    var finalDy = baseDy;
    var minDistance = 210; // Minimum distance between interface centers
    
    // Collect all existing interface positions on the same host
    var existingPositions = [];
    ifs.forEach(function(otherItf) {
        if (otherItf['if'] !== itf['if'] && 
            otherItf['hid'] === itf['hid'] && 
            otherItf['dx'] !== undefined && 
            otherItf['dy'] !== undefined) {
            existingPositions.push({
                dx: otherItf['dx'],
                dy: otherItf['dy']
            });
        }
    });
    
    // If there are existing interfaces, find non-overlapping position
    if (existingPositions.length > 0) {
        var foundPosition = false;
        
        // Try these offset positions in order
        var offsetOptions = [
            {x: 0, y: 0},          // Original
            {x: 0, y: 110},        // Below
            {x: 0, y: -110},       // Above
            {x: 210, y: 0},        // Right
            {x: -210, y: 0},       // Left
            {x: 210, y: 110},      // Bottom-right
            {x: -210, y: 110},     // Bottom-left
            {x: 210, y: -110},     // Top-right
            {x: -210, y: -110},    // Top-left
            {x: 0, y: 220},        // Far below
            {x: 0, y: -220},       // Far above
            {x: 420, y: 0},        // Far right
            {x: -420, y: 0},       // Far left
            {x: 315, y: 0},        // Medium right
            {x: -315, y: 0},       // Medium left
            {x: 315, y: 110},      // Medium bottom-right
            {x: -315, y: 110}      // Medium bottom-left
        ];
        
        for (var i = 0; i < offsetOptions.length && !foundPosition; i++) {
            var testDx = baseDx + offsetOptions[i].x;
            var testDy = baseDy + offsetOptions[i].y;
            var hasOverlap = false;
            
            // Check distance to all existing interfaces
            for (var j = 0; j < existingPositions.length; j++) {
                var distance = Math.sqrt(
                    Math.pow(testDx - existingPositions[j].dx, 2) + 
                    Math.pow(testDy - existingPositions[j].dy, 2)
                );
                
                if (distance < minDistance) {
                    hasOverlap = true;
                    break;
                }
            }
            
            if (!hasOverlap) {
                finalDx = testDx;
                finalDy = testDy;
                foundPosition = true;
            }
        }
    }
    
    itf['dx'] = finalDx;
    itf['dy'] = finalDy;

    if (itf['type'] == 'std')
    {
	var newelem = document.createElement('div');
	newelem.className = 'itf_div';
	newelem.style.position = "absolute";
	newelem.style.top = (itf['h']['y']+itf['dy'])+'px';
	newelem.style.left = (itf['h']['x']+itf['dx'])+'px';
	newelem.setAttribute('data-interface-id', itf['if']);
	newelem.setAttribute('data-draggable', 'true');
	newelem.style.cursor = 'move';
	if (itf['ip_edit'] == 'true') ip_active = ''; else ip_active = 'disabled';
	if (itf['mask_edit'] == 'true') mask_active = ''; else mask_active = 'disabled';
	newelem.innerHTML = '<table class=if_tab><tr><td colspan=3 style="text-align:center;">interface '+itf['if']+'</td></tr><tr><td>IP</td><td> : </td><td><input size=15 type=text id=ip_'+itf['if']+' value="'+itf['ip']+'" '+ip_active+'><td></tr><tr><td>Mask</td><td> : </td><td><input size=15 type=text id=mask_'+itf['if']+' value="'+itf['mask']+'" '+mask_active+'></td></tr></table>';
	root.appendChild(newelem);
	
	// Store reference for dragging
	itf['element'] = newelem;
    }
}





function draw_links(parent, l)
{
    if (!l['if1'] || !l['if2']) err("links", "id");

    ifs.forEach(i => {if (i['if'] == l['if1']) l['e1'] = i});
    ifs.forEach(i => {if (i['if'] == l['if2']) l['e2'] = i});

    hosts.forEach(h => {if (h['id'] == l['e1']['hid']) l['h1'] = h});
    hosts.forEach(h => {if (h['id'] == l['e2']['hid']) l['h2'] = h});
    
    var svg = document.getElementById('sl');
    if (!svg) return;
    
    // Simple gray connection line
    var aLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
    aLine.setAttribute('id', 'link_'+l['if1']+'_'+l['if2']);
    aLine.id = 'link_'+l['if1']+'_'+l['if2'];
    aLine.setAttribute('x1', ""+(parseInt(l['h1']['x'])+parseInt(l['h1']['w'])/2));
    aLine.setAttribute('y1', ""+(parseInt(l['h1']['y'])+parseInt(l['h1']['h'])/2));
    aLine.setAttribute('x2', ""+(parseInt(l['h2']['x'])+parseInt(l['h2']['w'])/2));
    aLine.setAttribute('y2', ""+(parseInt(l['h2']['y'])+parseInt(l['h2']['h'])/2));
    aLine.setAttribute('stroke', "#9ca3af");
    aLine.setAttribute('stroke-width', 2);
    svg.appendChild(aLine);
}


// Draw visual connections between interfaces and routing table of their host
function drawInterfaceConnections(parent) {
    var svg = document.getElementById('sl');
    if (!svg) return;
    
    // For each host, draw lines from host center to each interface
    hosts.forEach(function(h) {
        var hostCenterX = parseInt(h['x']) + parseInt(h['w']) / 2;
        var hostCenterY = parseInt(h['y']) + parseInt(h['h']) / 2;
        
        // Draw lines to each interface on this host
        ifs.forEach(function(itf) {
            if (itf['hid'] === h['id'] && itf['type'] === 'std') {
                // Get the current position from the DOM element (for draggable interfaces)
                var interfaceDiv = document.querySelector('.itf_div[data-interface-id="' + itf['if'] + '"]');
                if (!interfaceDiv) return;
                
                var rect = interfaceDiv.getBoundingClientRect();
                var canvasWrapper = document.getElementById('canvas_wrapper');
                var canvasRect = canvasWrapper ? canvasWrapper.getBoundingClientRect() : {left: 0, top: 0};
                
                // Calculate interface center (accounting for canvas transform)
                var itfCenterX = (rect.left - canvasRect.left) / canvasState.scale + (rect.width / canvasState.scale) / 2;
                var itfCenterY = (rect.top - canvasRect.top) / canvasState.scale + (rect.height / canvasState.scale) / 2;
                
                // Draw dotted line from host center to interface
                var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', hostCenterX);
                line.setAttribute('y1', hostCenterY);
                line.setAttribute('x2', itfCenterX);
                line.setAttribute('y2', itfCenterY);
                line.setAttribute('stroke', '#cbd5e1'); // Light gray
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('stroke-dasharray', '4,3'); // Dotted line
                line.setAttribute('opacity', '0.6');
                line.setAttribute('class', 'interface-connection');
                svg.appendChild(line); // Add to end so it's visible
            }
        });
        
        // Draw line from host center to routing table (if it has routes)
        var hasRoutes = false;
        routes.forEach(function(r) {
            if (r['hid'] === h['id']) {
                hasRoutes = true;
            }
        });
        
        if (hasRoutes) {
            // Get the actual routing table position from the DOM
            var routingTable = document.querySelector('[data-routing-table="true"][data-host-id="' + h['id'] + '"]');
            if (routingTable) {
                var tableRect = routingTable.getBoundingClientRect();
                var canvasWrapper = document.getElementById('canvas_wrapper');
                var canvasRect = canvasWrapper ? canvasWrapper.getBoundingClientRect() : {left: 0, top: 0};
                
                // Calculate routing table center (accounting for canvas transform)
                var routeTableX = (tableRect.left - canvasRect.left) / canvasState.scale + (tableRect.width / canvasState.scale) / 2;
                var routeTableY = (tableRect.top - canvasRect.top) / canvasState.scale + (tableRect.height / canvasState.scale) / 2;
                
                var line = document.createElementNS('http://www.w3.org/2000/svg', 'line');
                line.setAttribute('x1', hostCenterX);
                line.setAttribute('y1', hostCenterY);
                line.setAttribute('x2', routeTableX);
                line.setAttribute('y2', routeTableY);
                line.setAttribute('stroke', '#94a3b8'); // Slightly darker gray
                line.setAttribute('stroke-width', '1.5');
                line.setAttribute('stroke-dasharray', '6,4'); // Different dash pattern
                line.setAttribute('opacity', '0.5');
                line.setAttribute('class', 'routing-connection');
                svg.appendChild(line); // Add to end so it's visible
            }
        }
    });
    
    // Draw blue topology lines: host↔router/switch and router↔internet
    links.forEach(function(link) {
        if (!link['h1'] || !link['h2']) return;
        
        var h1Type = link['h1']['type'];
        var h2Type = link['h2']['type'];
        
        // Determine if this connection should have a blue line
        var shouldDrawBlue = false;
        
        // Host connected to Host (direct connection in early levels)
        if (h1Type === 'host' && h2Type === 'host') {
            shouldDrawBlue = true;
        }
        
        // Host connected to Router or Switch
        if ((h1Type === 'host' && (h2Type === 'router' || h2Type === 'switch')) ||
            (h2Type === 'host' && (h1Type === 'router' || h1Type === 'switch'))) {
            shouldDrawBlue = true;
        }
        
        // Router connected to Internet
        if ((h1Type === 'router' && h2Type === 'internet') ||
            (h2Type === 'router' && h1Type === 'internet')) {
            shouldDrawBlue = true;
        }
        
        // Router connected to Router
        if (h1Type === 'router' && h2Type === 'router') {
            shouldDrawBlue = true;
        }
        
        // Switch connected to Router
        if ((h1Type === 'switch' && h2Type === 'router') ||
            (h2Type === 'switch' && h1Type === 'router')) {
            shouldDrawBlue = true;
        }
        
        if (shouldDrawBlue) {
            var h1CenterX = parseInt(link['h1']['x']) + parseInt(link['h1']['w']) / 2;
            var h1CenterY = parseInt(link['h1']['y']) + parseInt(link['h1']['h']) / 2;
            var h2CenterX = parseInt(link['h2']['x']) + parseInt(link['h2']['w']) / 2;
            var h2CenterY = parseInt(link['h2']['y']) + parseInt(link['h2']['h']) / 2;
            
            var connectionLine = document.createElementNS('http://www.w3.org/2000/svg', 'line');
            connectionLine.setAttribute('x1', h1CenterX);
            connectionLine.setAttribute('y1', h1CenterY);
            connectionLine.setAttribute('x2', h2CenterX);
            connectionLine.setAttribute('y2', h2CenterY);
            connectionLine.setAttribute('stroke', '#3b82f6'); // Blue color
            connectionLine.setAttribute('stroke-width', '2.5');
            connectionLine.setAttribute('stroke-dasharray', '8,4'); // Dashed line
            connectionLine.setAttribute('opacity', '0.5');
            connectionLine.setAttribute('class', 'topology-connection');
            svg.appendChild(connectionLine);
        }
    });
}


function prep_goals(g)
{
    if (!g['id']) err("goals", "id");

    if (g['if_id1'])
	ifs.forEach(itf => { if (itf['if'] == g['if_id1']) { g['h1'] = itf['h']; g['src'] = g['if_id1']; g['src_type'] = 'if'; g['src_name'] = 'interface';}});
    if (!g['src'] && g['id1'])
	hosts.forEach(h => { if (h['id'] == g['id1']) { g['h1'] = h; g['src'] = g['id1']; g['src_type'] = 'hid'; g['src_name'] = 'host';}});
    if (!g['src'])
	err("goals "+g['id'], "id1/if_id1");

    if (g['if_id2'])
	ifs.forEach(itf => { if (itf['if'] == g['if_id2']) { g['h2'] = itf['h']; g['dst'] = g['if_id2']; g['dst_type'] = 'if'; g['dst_name'] = 'interface';}});
    if (!g['dst'] && g['id2'])
	hosts.forEach(h => { if (h['id'] == g['id2']) { g['h2'] = h; g['dst'] = g['id2']; g['dst_type'] = 'hid'; g['dst_name'] = 'host';}});
    if (!g['dst'])
	err("goals "+g['id'], "id2/if_id2");
}


function next_eval()
{
    if (g_eval_lvls.length >= 3)
	return ('end.html');
    var lvl;
    do {
	lvl = Math.round(6 + 4*Math.random());
    } while (g_eval_lvls.includes(lvl))
    g_eval_lvls.push(lvl);
    localStorage.setItem("g_my_eval", JSON.stringify(g_eval_lvls));
    return ('level'+lvl+'.html');
}


function my_download(filename, text)
{
    var element = document.createElement('a');
    element.setAttribute('href', 'data:text/plain;charset=utf-8,' + encodeURIComponent(text));
    element.setAttribute('download', filename);

    element.style.display = 'none';
    document.body.appendChild(element);

    element.click();

    document.body.removeChild(element);
}

function dl_config()
{
    var infos = { 'routes':{}, 'ifs':{} };
    routes.forEach(elem => { infos['routes'][elem['rid']] = {};
			     if (elem['route_edit'] == 'true') infos['routes'][elem['rid']]['route'] = document.getElementById('route_'+elem['rid']).value;
			     if (elem['gate_edit'] == 'true') infos['routes'][elem['rid']]['gate'] = document.getElementById('gate_'+elem['rid']).value;
			   });
    ifs.forEach(elem => { infos['ifs'][elem['if']] = {};
			  if (elem['ip_edit'] == 'true') infos['ifs'][elem['if']]['ip'] = document.getElementById('ip_'+elem['if']).value;
			  if (elem['mask_edit'] == 'true') infos['ifs'][elem['if']]['mask'] = document.getElementById('mask_'+elem['if']).value;
			});
    my_download('level'+level+'.json', JSON.stringify(infos));
}


function clearAllInputs()
{
    // Clear all editable route inputs
    routes.forEach(function(elem) {
        if (elem['route_edit'] == 'true') {
            var routeInput = document.getElementById('route_'+elem['rid']);
            if (routeInput) routeInput.value = '';
        }
        if (elem['gate_edit'] == 'true') {
            var gateInput = document.getElementById('gate_'+elem['rid']);
            if (gateInput) gateInput.value = '';
        }
    });
    
    // Clear all editable interface inputs
    ifs.forEach(function(elem) {
        if (elem['ip_edit'] == 'true') {
            var ipInput = document.getElementById('ip_'+elem['if']);
            if (ipInput) ipInput.value = '';
        }
        if (elem['mask_edit'] == 'true') {
            var maskInput = document.getElementById('mask_'+elem['if']);
            if (maskInput) maskInput.value = '';
        }
    });
    
    // Show confirmation
    alert('All editable inputs have been cleared!');
}


function show_goals(g)
{
    g_sim_logs += '******* Goal ID '+g['id']+' ********\n';
    var div = document.getElementById("goals_id");
    div.innerHTML += 'Goal '+g['id']+' : ';

    var obj = sim_goal(g);
    // remember status for logs rendering
    g_goal_status[g['id']] = obj;
    src_txt = g['src'];
    if (g['src_type'] == 'hid')
	src_txt = g['h1']['name'];
    dst_txt = g['dst'];
    if (g['dst_type'] == 'hid')
	dst_txt = g['h2']['name'];
    div.innerHTML += '<i>'+g['src_name']+" <b>"+src_txt+'</b></i> needs to communicate with <i>'+g['dst_name']+" <b>"+dst_txt+'</b></i> - Status : '+obj.text+'<br />\n';
    
    return (obj.status);
}


function all_goals()
{
    if (g_my_login != '')
	g_sim_logs = '** generated for login "'+g_my_login+'" **\n';
    else
	g_sim_logs = '** evaluation mode round '+g_eval_lvls.length+'**\n';
    document.getElementById("goals_id").innerHTML = '<h2 onclick="toggleGoalsPanel()" style="cursor: pointer; user-select: none;">Level '+level+' : <span id="goals_toggle_icon">▼</span></h2>\n<div id="goals_content">';
    
    var nb = 0;
    goals.forEach(elem => nb += show_goals(elem));
    document.getElementById("goals_id").innerHTML += '<input type=button value="Check again" onclick="all_goals();"> <input type=button value="Clear inputs" onclick="clearAllInputs();"> <input type=button value="Get my config" onclick="dl_config();">';
    if (nb == goals.length)
    {
	if (g_my_login != '')
	{
	    if (level < 10)
		document.getElementById("goals_id").innerHTML += " <input type=button value='Next level' onclick='window.location=\"level"+(level+1)+".html\";'>";
	    else
		document.getElementById("goals_id").innerHTML += " <input type=button value='Complete !' onclick='window.location=\"end.html\";'>";
	}
	else
	{   // defense case
	    document.getElementById("goals_id").innerHTML += " <input type=button value='Next' onclick='window.location=next_eval();'>";
	}		
    }
    document.getElementById("goals_id").innerHTML += '</div>'; // Close goals_content div
    render_logs();
}


function toggleGoalsPanel()
{
    var content = document.getElementById('goals_content');
    var icon = document.getElementById('goals_toggle_icon');
    
    if (content.style.display === 'none') {
        content.style.display = 'block';
        icon.textContent = '▼';
    } else {
        content.style.display = 'none';
        icon.textContent = '▶';
    }
}


function load_board()
{
    if (!(g_my_login = localStorage.getItem("g_my_login")))
	g_my_login = ''; // will means evaluation & full random
    g_rand_prev = level + hash_login(g_my_login); // initialize replayable pseudo random generator
    if (g_my_login == '')
	g_eval_lvls = JSON.parse(localStorage.getItem("g_my_eval"));
    
    var root = document.getElementById("root_id");
    
    // Wrap all content in a canvas wrapper for panning
    var wrapper = document.createElement('div');
    wrapper.className = 'canvas-content';
    wrapper.id = 'canvas_wrapper';
    
    // Move SVG into wrapper
    var svg = document.getElementById('sl');
    if (svg) {
        root.removeChild(svg);
        wrapper.appendChild(svg);
    }

    hosts.forEach(elem => show_host(wrapper, elem));

    ifs.forEach(elem => show_ifs(wrapper, elem));
    
    links.forEach(elem => draw_links(wrapper, elem));
    
    // Append wrapper to root
    root.appendChild(wrapper);
    
    // Draw visual connections between interfaces and routing tables
    // Must be called AFTER wrapper is appended to DOM so elements are accessible
    drawInterfaceConnections(wrapper);

    goals.forEach(elem => prep_goals(elem));
    
    // Create logs toggle button
    createLogsToggle();
    
    // Create canvas controls
    createCanvasControls();
    
    // Initialize draggable goals panel
    initDraggableGoals();
    
    // Initialize draggable interfaces
    initDraggableInterfaces();
    
    // Initialize draggable routing tables
    initDraggableRoutingTables();
    
    // Initialize infinite canvas panning
    initInfiniteCanvas();
    
    all_goals();
    // only for very first time : don't show any log
    if (!g_sim_logs || g_sim_logs.trim() === '') render_logs();
}

function createLogsToggle() {
    // Check if toggle already exists
    if (document.getElementById('logs_toggle')) return;
    
    var toggle = document.createElement('div');
    toggle.id = 'logs_toggle';
    toggle.className = 'logs-toggle';
    toggle.innerHTML = '<span>View Logs</span>';
    toggle.onclick = toggleLogs;
    document.body.appendChild(toggle);
}

function createCanvasControls() {
    if (document.getElementById('canvas_controls')) return;
    
    var controls = document.createElement('div');
    controls.id = 'canvas_controls';
    controls.className = 'canvas-controls';
    controls.innerHTML = `
        <button onclick="zoomIn()" title="Zoom In (Ctrl + Scroll)">+</button>
        <div class="canvas-zoom-level" id="zoom_level">100%</div>
        <button onclick="zoomOut()" title="Zoom Out (Ctrl + Scroll)">−</button>
        <button onclick="resetView()" title="Reset View (Center & 100%)">⌂</button>
    `;
    document.body.appendChild(controls);
}

function updateZoomDisplay() {
    var display = document.getElementById('zoom_level');
    if (display) {
        display.textContent = Math.round(canvasState.scale * 100) + '%';
    }
}

function zoomIn() {
    var newScale = canvasState.scale * 1.2;
    if (newScale > 3) return;
    
    // Zoom towards center
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    
    canvasState.translateX = centerX - (centerX - canvasState.translateX) * 1.2;
    canvasState.translateY = centerY - (centerY - canvasState.translateY) * 1.2;
    canvasState.scale = newScale;
    
    updateCanvasTransform();
    updateZoomDisplay();
}

function zoomOut() {
    var newScale = canvasState.scale * 0.8;
    if (newScale < 0.3) return;
    
    var centerX = window.innerWidth / 2;
    var centerY = window.innerHeight / 2;
    
    canvasState.translateX = centerX - (centerX - canvasState.translateX) * 0.8;
    canvasState.translateY = centerY - (centerY - canvasState.translateY) * 0.8;
    canvasState.scale = newScale;
    
    updateCanvasTransform();
    updateZoomDisplay();
}

function resetView() {
    canvasState.scale = 1;
    centerCanvas();
    updateZoomDisplay();
}

// ========= Draggable Goals Panel =========

var dragState = {
    isDragging: false,
    startX: 0,
    startY: 0,
    elementX: 0,
    elementY: 0
};

function initDraggableGoals() {
    var goalsDiv = document.getElementById('goals_id');
    if (!goalsDiv) return;
    
    goalsDiv.addEventListener('mousedown', startDrag);
    document.addEventListener('mousemove', drag);
    document.addEventListener('mouseup', endDrag);
    
    // Touch support for mobile
    goalsDiv.addEventListener('touchstart', startDragTouch);
    document.addEventListener('touchmove', dragTouch);
    document.addEventListener('touchend', endDrag);
}

function startDrag(e) {
    // Don't drag if clicking on buttons or inputs
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    
    var goalsDiv = document.getElementById('goals_id');
    dragState.isDragging = true;
    dragState.startX = e.clientX;
    dragState.startY = e.clientY;
    
    // Get current position
    var rect = goalsDiv.getBoundingClientRect();
    dragState.elementX = rect.left;
    dragState.elementY = rect.top;
    
    goalsDiv.classList.add('dragging');
    e.preventDefault();
}

function startDragTouch(e) {
    if (e.target.tagName === 'INPUT' || e.target.tagName === 'BUTTON') return;
    
    var touch = e.touches[0];
    var goalsDiv = document.getElementById('goals_id');
    dragState.isDragging = true;
    dragState.startX = touch.clientX;
    dragState.startY = touch.clientY;
    
    var rect = goalsDiv.getBoundingClientRect();
    dragState.elementX = rect.left;
    dragState.elementY = rect.top;
    
    goalsDiv.classList.add('dragging');
}

function drag(e) {
    if (!dragState.isDragging) return;
    
    var goalsDiv = document.getElementById('goals_id');
    var deltaX = e.clientX - dragState.startX;
    var deltaY = e.clientY - dragState.startY;
    
    var newX = dragState.elementX + deltaX;
    var newY = dragState.elementY + deltaY;
    
    // Keep within viewport bounds
    var rect = goalsDiv.getBoundingClientRect();
    var maxX = window.innerWidth - rect.width;
    var maxY = window.innerHeight - rect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    goalsDiv.style.left = newX + 'px';
    goalsDiv.style.top = newY + 'px';
    goalsDiv.style.transform = 'none';
    
    e.preventDefault();
}

function dragTouch(e) {
    if (!dragState.isDragging) return;
    
    var touch = e.touches[0];
    var goalsDiv = document.getElementById('goals_id');
    var deltaX = touch.clientX - dragState.startX;
    var deltaY = touch.clientY - dragState.startY;
    
    var newX = dragState.elementX + deltaX;
    var newY = dragState.elementY + deltaY;
    
    var rect = goalsDiv.getBoundingClientRect();
    var maxX = window.innerWidth - rect.width;
    var maxY = window.innerHeight - rect.height;
    
    newX = Math.max(0, Math.min(newX, maxX));
    newY = Math.max(0, Math.min(newY, maxY));
    
    goalsDiv.style.left = newX + 'px';
    goalsDiv.style.top = newY + 'px';
    goalsDiv.style.transform = 'none';
    
    e.preventDefault();
}

function endDrag() {
    if (!dragState.isDragging) return;
    
    dragState.isDragging = false;
    var goalsDiv = document.getElementById('goals_id');
    if (goalsDiv) {
        goalsDiv.classList.remove('dragging');
    }
}

// ========= Draggable Interfaces =========

var interfaceDragState = {
    isDragging: false,
    currentInterface: null,
    startX: 0,
    startY: 0,
    elementX: 0,
    elementY: 0
};

function initDraggableInterfaces() {
    // Add event listeners to all interface divs
    var interfaceDivs = document.querySelectorAll('.itf_div[data-draggable="true"]');
    
    interfaceDivs.forEach(function(div) {
        div.addEventListener('mousedown', startInterfaceDrag);
        div.addEventListener('touchstart', startInterfaceDragTouch);
    });
    
    // Global listeners for move and end
    document.addEventListener('mousemove', dragInterface);
    document.addEventListener('mouseup', endInterfaceDrag);
    document.addEventListener('touchmove', dragInterfaceTouch);
    document.addEventListener('touchend', endInterfaceDrag);
}

function startInterfaceDrag(e) {
    // Only drag if clicking on the header, not on inputs
    if (e.target.tagName === 'INPUT') return;
    
    var interfaceDiv = e.currentTarget;
    interfaceDragState.isDragging = true;
    interfaceDragState.currentInterface = interfaceDiv;
    interfaceDragState.startX = e.clientX;
    interfaceDragState.startY = e.clientY;
    
    // Get current position relative to canvas transform
    var rect = interfaceDiv.getBoundingClientRect();
    var canvasWrapper = document.getElementById('canvas_wrapper');
    var canvasRect = canvasWrapper.getBoundingClientRect();
    
    // Calculate position relative to canvas
    interfaceDragState.elementX = (rect.left - canvasRect.left) / canvasState.scale;
    interfaceDragState.elementY = (rect.top - canvasRect.top) / canvasState.scale;
    
    interfaceDiv.style.cursor = 'grabbing';
    interfaceDiv.style.zIndex = '1000'; // Bring to front while dragging
    
    e.preventDefault();
    e.stopPropagation(); // Prevent canvas panning
}

function startInterfaceDragTouch(e) {
    if (e.target.tagName === 'INPUT') return;
    
    var touch = e.touches[0];
    var interfaceDiv = e.currentTarget;
    interfaceDragState.isDragging = true;
    interfaceDragState.currentInterface = interfaceDiv;
    interfaceDragState.startX = touch.clientX;
    interfaceDragState.startY = touch.clientY;
    
    var rect = interfaceDiv.getBoundingClientRect();
    var canvasWrapper = document.getElementById('canvas_wrapper');
    var canvasRect = canvasWrapper.getBoundingClientRect();
    
    interfaceDragState.elementX = (rect.left - canvasRect.left) / canvasState.scale;
    interfaceDragState.elementY = (rect.top - canvasRect.top) / canvasState.scale;
    
    interfaceDiv.style.cursor = 'grabbing';
    interfaceDiv.style.zIndex = '1000';
    
    e.preventDefault();
    e.stopPropagation();
}

function dragInterface(e) {
    if (!interfaceDragState.isDragging) return;
    
    var deltaX = (e.clientX - interfaceDragState.startX) / canvasState.scale;
    var deltaY = (e.clientY - interfaceDragState.startY) / canvasState.scale;
    
    var newX = interfaceDragState.elementX + deltaX;
    var newY = interfaceDragState.elementY + deltaY;
    
    interfaceDragState.currentInterface.style.left = newX + 'px';
    interfaceDragState.currentInterface.style.top = newY + 'px';
    
    // Update interface connection lines
    updateInterfaceConnections();
    
    e.preventDefault();
}

function dragInterfaceTouch(e) {
    if (!interfaceDragState.isDragging) return;
    
    var touch = e.touches[0];
    var deltaX = (touch.clientX - interfaceDragState.startX) / canvasState.scale;
    var deltaY = (touch.clientY - interfaceDragState.startY) / canvasState.scale;
    
    var newX = interfaceDragState.elementX + deltaX;
    var newY = interfaceDragState.elementY + deltaY;
    
    interfaceDragState.currentInterface.style.left = newX + 'px';
    interfaceDragState.currentInterface.style.top = newY + 'px';
    
    // Update interface connection lines
    updateInterfaceConnections();
    
    e.preventDefault();
}

function endInterfaceDrag() {
    if (interfaceDragState.isDragging && interfaceDragState.currentInterface) {
        interfaceDragState.currentInterface.style.cursor = 'move';
        interfaceDragState.currentInterface.style.zIndex = '30';
    }
    interfaceDragState.isDragging = false;
    interfaceDragState.currentInterface = null;
}

// Update connection lines when interface is moved
function updateInterfaceConnections() {
    // Remove old interface connection lines
    var svg = document.getElementById('sl');
    if (!svg) return;
    
    var oldLines = svg.querySelectorAll('.interface-connection, .routing-connection, .topology-connection');
    oldLines.forEach(function(line) {
        line.parentNode.removeChild(line);
    });
    
    // Redraw all connections
    drawInterfaceConnections();
}


// ========= Draggable Routing Tables =========

var routingTableDragState = {
    isDragging: false,
    currentTable: null,
    startX: 0,
    startY: 0,
    elementX: 0,
    elementY: 0
};

function initDraggableRoutingTables() {
    var routingTables = document.querySelectorAll('[data-routing-table="true"]');
    
    routingTables.forEach(function(table) {
        // Mouse events
        table.addEventListener('mousedown', startRoutingTableDrag);
        
        // Touch events
        table.addEventListener('touchstart', startRoutingTableDragTouch);
    });
    
    // Global move and end handlers
    document.addEventListener('mousemove', dragRoutingTable);
    document.addEventListener('mouseup', endRoutingTableDrag);
    document.addEventListener('touchmove', dragRoutingTableTouch);
    document.addEventListener('touchend', endRoutingTableDrag);
}

function startRoutingTableDrag(e) {
    // Don't drag if clicking on an input field
    if (e.target.tagName === 'INPUT') {
        return;
    }
    
    var table = e.target.closest('[data-routing-table="true"]');
    if (!table) return;
    
    routingTableDragState.isDragging = true;
    routingTableDragState.currentTable = table;
    routingTableDragState.startX = e.clientX;
    routingTableDragState.startY = e.clientY;
    routingTableDragState.elementX = parseInt(table.style.left) || 0;
    routingTableDragState.elementY = parseInt(table.style.top) || 0;
    
    table.style.cursor = 'grabbing';
    table.style.zIndex = '100';
    
    e.preventDefault();
}

function startRoutingTableDragTouch(e) {
    // Don't drag if touching an input field
    if (e.target.tagName === 'INPUT') {
        return;
    }
    
    var table = e.target.closest('[data-routing-table="true"]');
    if (!table) return;
    
    var touch = e.touches[0];
    routingTableDragState.isDragging = true;
    routingTableDragState.currentTable = table;
    routingTableDragState.startX = touch.clientX;
    routingTableDragState.startY = touch.clientY;
    routingTableDragState.elementX = parseInt(table.style.left) || 0;
    routingTableDragState.elementY = parseInt(table.style.top) || 0;
    
    table.style.cursor = 'grabbing';
    table.style.zIndex = '100';
    
    e.preventDefault();
}

function dragRoutingTable(e) {
    if (!routingTableDragState.isDragging) return;
    
    var deltaX = (e.clientX - routingTableDragState.startX) / canvasState.scale;
    var deltaY = (e.clientY - routingTableDragState.startY) / canvasState.scale;
    
    var newX = routingTableDragState.elementX + deltaX;
    var newY = routingTableDragState.elementY + deltaY;
    
    routingTableDragState.currentTable.style.left = newX + 'px';
    routingTableDragState.currentTable.style.top = newY + 'px';
    
    // Update routing table connection lines
    updateInterfaceConnections();
    
    e.preventDefault();
}

function dragRoutingTableTouch(e) {
    if (!routingTableDragState.isDragging) return;
    
    var touch = e.touches[0];
    var deltaX = (touch.clientX - routingTableDragState.startX) / canvasState.scale;
    var deltaY = (touch.clientY - routingTableDragState.startY) / canvasState.scale;
    
    var newX = routingTableDragState.elementX + deltaX;
    var newY = routingTableDragState.elementY + deltaY;
    
    routingTableDragState.currentTable.style.left = newX + 'px';
    routingTableDragState.currentTable.style.top = newY + 'px';
    
    // Update routing table connection lines
    updateInterfaceConnections();
    
    e.preventDefault();
}

function endRoutingTableDrag() {
    if (routingTableDragState.isDragging && routingTableDragState.currentTable) {
        routingTableDragState.currentTable.style.cursor = 'move';
        routingTableDragState.currentTable.style.zIndex = '20';
    }
    routingTableDragState.isDragging = false;
}


// ========= Infinite Canvas Panning =========

var canvasState = {
    isPanning: false,
    startX: 0,
    startY: 0,
    translateX: 0,
    translateY: 0,
    scale: 1
};

function initInfiniteCanvas() {
    var root = document.getElementById('root_id');
    if (!root) return;
    
    root.addEventListener('mousedown', startPan);
    document.addEventListener('mousemove', pan);
    document.addEventListener('mouseup', endPan);
    
    // Touch support
    root.addEventListener('touchstart', startPanTouch, { passive: false });
    document.addEventListener('touchmove', panTouch, { passive: false });
    document.addEventListener('touchend', endPan);
    
    // Mouse wheel for zoom
    root.addEventListener('wheel', handleZoom, { passive: false });
    
    // Center the canvas initially
    centerCanvas();
    updateZoomDisplay();
    
    // Show pan hint on first load
    showPanHint();
}

function showPanHint() {
    // Check if hint was already shown
    if (localStorage.getItem('pan_hint_shown')) return;
    
    var hint = document.createElement('div');
    hint.className = 'pan-hint';
    hint.textContent = '💡 Drag to pan • Ctrl+Scroll to zoom';
    document.body.appendChild(hint);
    
    setTimeout(function() {
        if (hint.parentNode) {
            hint.parentNode.removeChild(hint);
        }
        localStorage.setItem('pan_hint_shown', 'true');
    }, 4000);
}

function centerCanvas() {
    var wrapper = document.getElementById('canvas_wrapper');
    if (!wrapper) return;
    
    // Center the content
    canvasState.translateX = (window.innerWidth - 2000) / 2;
    canvasState.translateY = 100; // Some padding from top
    
    updateCanvasTransform();
}

function updateCanvasTransform() {
    var wrapper = document.getElementById('canvas_wrapper');
    if (!wrapper) return;
    
    wrapper.style.transform = 
        'translate(' + canvasState.translateX + 'px, ' + canvasState.translateY + 'px) ' +
        'scale(' + canvasState.scale + ')';
}

function startPan(e) {
    // Don't pan if clicking on a host, interface, or other interactive element
    if (e.target.tagName === 'INPUT' || 
        e.target.tagName === 'BUTTON' ||
        e.target.closest('.host_div') ||
        e.target.closest('.itf_div') ||
        e.target.closest('.host_info_div')) {
        return;
    }
    
    var root = document.getElementById('root_id');
    if (e.target !== root && !e.target.classList.contains('canvas-content')) return;
    
    canvasState.isPanning = true;
    canvasState.startX = e.clientX - canvasState.translateX;
    canvasState.startY = e.clientY - canvasState.translateY;
    
    root.style.cursor = 'grabbing';
    e.preventDefault();
}

function startPanTouch(e) {
    if (e.touches.length !== 1) return;
    
    var touch = e.touches[0];
    var root = document.getElementById('root_id');
    
    if (e.target !== root && !e.target.classList.contains('canvas-content')) return;
    
    canvasState.isPanning = true;
    canvasState.startX = touch.clientX - canvasState.translateX;
    canvasState.startY = touch.clientY - canvasState.translateY;
    
    e.preventDefault();
}

function pan(e) {
    if (!canvasState.isPanning) return;
    
    canvasState.translateX = e.clientX - canvasState.startX;
    canvasState.translateY = e.clientY - canvasState.startY;
    
    updateCanvasTransform();
    e.preventDefault();
}

function panTouch(e) {
    if (!canvasState.isPanning || e.touches.length !== 1) return;
    
    var touch = e.touches[0];
    canvasState.translateX = touch.clientX - canvasState.startX;
    canvasState.translateY = touch.clientY - canvasState.startY;
    
    updateCanvasTransform();
    e.preventDefault();
}

function endPan() {
    if (!canvasState.isPanning) return;
    
    canvasState.isPanning = false;
    var root = document.getElementById('root_id');
    if (root) {
        root.style.cursor = 'grab';
    }
}

function handleZoom(e) {
    // Zoom with mouse wheel (Ctrl+wheel)
    if (!e.ctrlKey && !e.metaKey) return;
    
    e.preventDefault();
    
    var delta = e.deltaY > 0 ? 0.9 : 1.1;
    var newScale = canvasState.scale * delta;
    
    // Limit zoom
    if (newScale < 0.3 || newScale > 3) return;
    
    // Zoom towards mouse position
    var rect = document.getElementById('root_id').getBoundingClientRect();
    var mouseX = e.clientX - rect.left;
    var mouseY = e.clientY - rect.top;
    
    canvasState.translateX = mouseX - (mouseX - canvasState.translateX) * delta;
    canvasState.translateY = mouseY - (mouseY - canvasState.translateY) * delta;
    canvasState.scale = newScale;
    
    updateCanvasTransform();
    updateZoomDisplay();
}


// ========= Goal Connection Lines =========

function clearGoalLines() {
    var svg = document.getElementById('sl');
    if (!svg) return;
    
    // Remove all previous goal lines
    var goalLines = svg.querySelectorAll('.goal-line');
    goalLines.forEach(function(line) {
        line.parentNode.removeChild(line);
    });
}

function getDevicePosition(goal, isSource) {
    var h = isSource ? goal['h1'] : goal['h2'];
    var type = isSource ? goal['src_type'] : goal['dst_type'];
    var id = isSource ? goal['src'] : goal['dst'];
    
    if (!h) return null;
    
    // For host type, return center of host
    if (type === 'hid') {
        return {
            x: parseInt(h['x']) + parseInt(h['w']) / 2,
            y: parseInt(h['y']) + parseInt(h['h']) / 2,
            host: h
        };
    }
    
    // For interface type, find the interface position
    if (type === 'if') {
        var itf = null;
        ifs.forEach(function(i) {
            if (i['if'] === id) itf = i;
        });
        if (itf && itf['h']) {
            return {
                x: parseInt(itf['h']['x']) + parseInt(itf['dx']) + 95,
                y: parseInt(itf['h']['y']) + parseInt(itf['dy']) + 40,
                host: itf['h']
            };
        }
    }
    
    return null;
}

// Trace the routing path and return array of waypoints
function traceRoutingPath(goal) {
    if (!goal['h1'] || !goal['h2']) return null;
    
    var srcType = goal['src_type'];
    var dstType = goal['dst_type'];
    var srcId = goal['src'];
    var dstId = goal['dst'];
    
    // Find source and destination IPs
    var srcIp = null, dstIp = null;
    
    if (srcType === 'if') {
        ifs.forEach(function(i) {
            if (i['if'] === srcId) {
                srcIp = get_if_ip(i);
            }
        });
    }
    
    if (dstType === 'if') {
        ifs.forEach(function(i) {
            if (i['if'] === dstId) {
                dstIp = get_if_ip(i);
            }
        });
    }
    
    if (!srcIp || !dstIp) return null;
    
    // Trace the path by simulating routing
    var waypoints = [];
    var visitedHosts = [];
    
    function getHostCenter(h) {
        return {
            x: parseInt(h['x']) + parseInt(h['w']) / 2,
            y: parseInt(h['y']) + parseInt(h['h']) / 2
        };
    }
    
    function tracePath(currentHost, targetIp, fromInterface) {
        // Prevent infinite loops
        if (visitedHosts.includes(currentHost['id'])) return false;
        visitedHosts.push(currentHost['id']);
        
        // Add current host to waypoints
        waypoints.push(getHostCenter(currentHost));
        
        // Check if we've reached destination
        var reachedDest = false;
        ifs.forEach(function(itf) {
            if (itf['hid'] === currentHost['id'] && get_if_ip(itf) === targetIp) {
                reachedDest = true;
            }
        });
        
        if (reachedDest) return true;
        
        // If switch, broadcast to all connections
        if (currentHost['type'] === 'switch') {
            var found = false;
            links.forEach(function(l) {
                if (!found) {
                    if (l['e1']['hid'] === currentHost['id'] && l['e2']) {
                        found = tracePath(l['h2'], targetIp, l['e2']);
                    } else if (l['e2']['hid'] === currentHost['id'] && l['e1']) {
                        found = tracePath(l['h1'], targetIp, l['e1']);
                    }
                }
            });
            return found;
        }
        
        // Check interfaces for direct connection
        var foundDirectly = false;
        ifs.forEach(function(itf) {
            if (!foundDirectly && itf['hid'] === currentHost['id']) {
                if (ip_match_if(targetIp, itf)) {
                    // Found on same subnet, go to next hop
                    links.forEach(function(l) {
                        if (!foundDirectly) {
                            if (l['if1'] === itf['if'] && l['h2']) {
                                foundDirectly = tracePath(l['h2'], targetIp, l['e2']);
                            } else if (l['if2'] === itf['if'] && l['h1']) {
                                foundDirectly = tracePath(l['h1'], targetIp, l['e1']);
                            }
                        }
                    });
                }
            }
        });
        
        if (foundDirectly) return true;
        
        // Check routing table
        var foundViaRoute = false;
        routes.forEach(function(r) {
            if (!foundViaRoute && r['hid'] === currentHost['id']) {
                if (ip_match_route(targetIp, r)) {
                    var gateIp = get_route_gate(r);
                    if (gateIp !== null) {
                        // Find interface that can reach this gateway
                        ifs.forEach(function(itf) {
                            if (!foundViaRoute && itf['hid'] === currentHost['id']) {
                                if (ip_match_if(gateIp, itf)) {
                                    // Follow the link
                                    links.forEach(function(l) {
                                        if (!foundViaRoute) {
                                            if (l['if1'] === itf['if'] && l['h2']) {
                                                foundViaRoute = tracePath(l['h2'], targetIp, l['e2']);
                                            } else if (l['if2'] === itf['if'] && l['h1']) {
                                                foundViaRoute = tracePath(l['h1'], targetIp, l['e1']);
                                            }
                                        }
                                    });
                                }
                            }
                        });
                    }
                }
            }
        });
        
        return foundViaRoute;
    }
    
    // Start tracing from source host
    if (tracePath(goal['h1'], dstIp, null)) {
        return waypoints;
    }
    
    return null;
}

function drawGoalLine(goal, status) {
    var svg = document.getElementById('sl');
    if (!svg) return;
    
    // Get the routing path
    var waypoints = traceRoutingPath(goal);
    
    if (!waypoints || waypoints.length < 2) {
        // Fallback to direct line if path tracing fails
        var srcPos = getDevicePosition(goal, true);
        var dstPos = getDevicePosition(goal, false);
        
        if (!srcPos || !dstPos) return;
        
        waypoints = [
            {x: srcPos.x, y: srcPos.y},
            {x: dstPos.x, y: dstPos.y}
        ];
    }
    
    // Draw polyline through all waypoints
    var pathData = 'M ' + waypoints[0].x + ' ' + waypoints[0].y;
    for (var i = 1; i < waypoints.length; i++) {
        pathData += ' L ' + waypoints[i].x + ' ' + waypoints[i].y;
    }
    
    var path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    path.setAttribute('class', 'goal-line');
    path.setAttribute('d', pathData);
    path.setAttribute('fill', 'none');
    path.setAttribute('stroke-width', '2');
    path.setAttribute('stroke-linecap', 'round');
    path.setAttribute('stroke-linejoin', 'round');
    path.setAttribute('opacity', '0.7');
    
    // Color based on status
    if (status === 1) {
        // Success - green
        path.setAttribute('stroke', '#16a34a');
    } else {
        // Failed - orange
        path.setAttribute('stroke', '#f97316');
    }
    
    svg.appendChild(path);
}


// ========= Enhanced logs rendering =========

function escapeHTML(s) {
    return s
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;');
}

function colorizeLine(line) {
    var cls = 'log-line';
    if (/error|invalid|fail|no (forward|reverse) way|multiple .* match|not .* routed|packet not for me/i.test(line)) cls = 'log-error';
    else if (/warn|loop detected/i.test(line)) cls = 'log-warn';
    else if (/OK|Congratulations/i.test(line)) cls = 'log-ok';
    else if (/forward way|reverse way|send to|route match|packet accepted|destination|pass to|gate|through interface/i.test(line)) cls = 'log-info';
    return '<span class="'+cls+'">'+escapeHTML(line)+'</span>';
}

function countErrors() {
    var count = 0;
    for (var id in g_goal_status) {
        if (g_goal_status[id] && g_goal_status[id].status === 0) count++;
    }
    return count;
}

function buildLogsHTML(raw) {
    var lines = raw.split(/\n/);
    var sections = [];
    var current = { id: null, lines: [] };
    var headerRe = /^\*{7}\s*Goal ID\s*(\d+)\s*\*+/i;
    for (var i = 0; i < lines.length; i++) {
        var m = lines[i].match(headerRe);
        if (m) {
            if (current.id !== null) sections.push(current);
            current = { id: m[1], lines: [] };
        } else {
            current.lines.push(lines[i]);
        }
    }
    if (current.id !== null || current.lines.length) sections.push(current);

    var html = '<div class="logs-header"><h3>Simulation Logs</h3><button class="logs-close" onclick="toggleLogs()">✕</button></div><div class="logs-content">';
    if (sections.length === 0) {
        html += '<div style="padding:12px; color: var(--muted-text); text-align: center;">No logs yet. Click "Check again" to run the simulation.</div>';
    }
    for (var j = 0; j < sections.length; j++) {
        var sec = sections[j];
        if (!sec.id) continue;
        var status = g_goal_status[sec.id];
        var label = 'Goal '+sec.id;
        if (status && status.text) label += ' — ' + status.text;
        var body = sec.lines.map(colorizeLine).join('\n');
        html += '<details class="goal-log"><summary>'+label+'</summary><pre>'+body+'</pre></details>';
    }
    html += '</div>';
    return html;
}

function toggleLogs() {
    var el = document.getElementById('logs_id');
    if (!el) return;
    el.classList.toggle('open');
}

function updateLogsToggle() {
    var toggle = document.getElementById('logs_toggle');
    if (!toggle) return;
    var errorCount = countErrors();
    var total = Object.keys(g_goal_status).length;
    var successCount = total - errorCount;
    
    if (errorCount > 0) {
        toggle.innerHTML = '<span>Logs</span><span class="error-badge">'+errorCount+' error'+(errorCount > 1 ? 's' : '')+'</span>';
    } else if (total > 0) {
        toggle.innerHTML = '<span>Logs</span><span class="success-badge">✓ All pass</span>';
    } else {
        toggle.innerHTML = '<span>View Logs</span>';
    }
}

function render_logs() {
    var el = document.getElementById('logs_id');
    if (!el) return;
    el.innerHTML = buildLogsHTML(g_sim_logs || '');
    updateLogsToggle();
}
