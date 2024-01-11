document.getElementById('redirect').addEventListener('click', function() {
	const route_name = this.getAttribute('data-route');
	redirect_to_route(route_name);
});


function redirect_to_route(route_name) {
	window.location.href = route_name;
}
