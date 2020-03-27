const findMovieOrShow = async function(query) {

    let response = await fetch(`${api_path}/search/multi?api_key=${api_key}&query=${query}`);
    let data = await response.json();

    return data;

}

const getMovieOrShow = async function(type, id) {

    let response = await fetch(`${api_path}/${type}/${id}?api_key=${api_key}`);
    let data = await response.json();

    return data;

}

const getMovieCredits = async function(type, id) {

    let response = await fetch(`${api_path}/${type}/${id}/credits?api_key=${api_key}`);
    let data = await response.json();

    return data;

}

const getTvSeason = async function(type, id, season_number) {

    let response = await fetch(`${api_path}/${type}/${id}/season/${season_number}?api_key=${api_key}`);
    let data = await response.json();

    return data;

}

const getTvSeasonEpisodeCredits = async function(type, id, season_number, episode_number) {

    let response = await fetch(`${api_path}/${type}/${id}/season/${season_number}/episode/${episode_number}/credits?api_key=${api_key}`);
    let data = await response.json();

    return data;
    
}
