document.getElementById('search').addEventListener('click', function(){
	filter_doubts();
});

function filter_doubts(){
	let study_area_filter = document.getElementById("study_area_filter").value;
	window.location.href = `/doubts-list?chosen_study_area=${encodeURIComponent(study_area_filter)}`;
}
