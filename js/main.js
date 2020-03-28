const api_key = "5eb10b8767980a1dc795085504be699c";
const api_path = "https://api.themoviedb.org/3";

let results = {
    "actors" : [],
};

let search = {
    "items" : [],
};

const showResultsButton = function() {
    let el = document.querySelector("#view-results-button");
    el.style.display = "block";
}

const findMovie = async function()
{
    let query = document.querySelector("#search").value;

    let response = await findMovieOrShow(query)

    let html = "";

    html += "<ul>";

    let counter = 0;

    for (let result of response.results) {
        if (result.media_type != "person")
        {
            let item = {
                "type" : result.media_type,
                "id" : result.id,
                "name" : (result.media_type === 'movie') ? result.title : result.name,
                "image" : handleImage(result.poster_path),
                "release_year" : parseInt((result.media_type === 'movie') ? new Date(Date.parse(result.release_date)).getFullYear() : new Date(Date.parse(result.first_air_date)).getFullYear()),
            };

            html += `<li onclick="addSearchItem(this)" class="item-to-search" data-type="${item.type}" data-id="${item.id}" data-name="${item.name}" data-image="${item.image}" data-release-year="${item.release_year}">`;
            html += getMovieComponent(item);
            html += `</li>`;

            counter++

            // only want to add first 6 items
            if (counter > 5) {
                break;
            }
        }
    }

    html += "</ul>";

    let el = document.querySelector("#auto-complete-results");
    el.innerHTML = html;
}

const updateSearchItems = function() {

    let html = "";

    html += "<ul>";

    search.items.forEach(item => {
        html += `<li onclick="removeSearchItem(this)" class="item-to-search" data-type="${item.type}" data-id="${item.id}" data-name="${item.name}" data-image="${item.image}" data-release-year="${item.release_year}">`;
        html += getMovieComponent(item);
        html += `</li>`;
    });

    html += "</ul>";

    let el = document.querySelector("#items-to-search");
    el.innerHTML = html;

}

const addSearchItem = function(el) {

    let id = parseInt(el.getAttribute("data-id"));

    // need to prevent them from adding the same thing twice
    if (search.items.filter(function(e) { return e.id === id; }).length > 0) {
        alert("You have already chosen that item!");
        clearAutoComplete();
        return;
    }  

    if (search.items.length < 6)
    {
        let item = {
            "type" : el.getAttribute("data-type"),
            "id" : id,
            "name" : el.getAttribute("data-name"),
            "image" : el.getAttribute("data-image"),
            "release_year" : parseInt(el.getAttribute("data-release-year")),
        };
    
        search.items.push(item);
    
        updateSearchItems();
    } else {
        alert("You can only compare up to 6 items!");
    }

    clearAutoComplete();
}

const clearAutoComplete = function() {
    let el = document.querySelector("#auto-complete-results");
    el.innerHTML = "";

    el = document.querySelector("#search");
    el.value = "";

    el.focus();
}

const removeSearchItem = function(el) {

    let searchItem = {
        "type" : el.getAttribute("data-type"),
        "id" : parseInt(el.getAttribute("data-id")),
    };

    search.items = search.items.filter(function( item ) {
        if (item.type === searchItem.type)
        {
            return item.id !== searchItem.id;
        } else {
            return true;
        }
    });

    updateSearchItems();
}

document.addEventListener("DOMContentLoaded", async function() {

    //setup before functions
    let typingTimer;                //timer identifier
    let doneTypingInterval = 1000;  //time in ms (1 seconds)
    let myInput = document.getElementById('search');

    //on keyup, start the countdown
    myInput.addEventListener('keyup', () => {
        clearTimeout(typingTimer);
        if (myInput.value) {
            typingTimer = setTimeout(doneTyping, doneTypingInterval);
        }
    });

    //user is "finished typing," do something
    function doneTyping () {
        findMovie();
    }

    // show the search panel to start
    show(document.querySelector("#search-panel"));

    // hide the results panel to start
    hide(document.querySelector("#results-panel"));

});

document.addEventListener("click", function(event) {
    if (event.target.closest("#auto-complete-results")) return;
    clearAutoComplete();
});

const compare = async function() {

    // validate they have enough items
    if (search.items.length < 2) {
        alert("You have to compare at least 2 items!");
        return;
    }
    
    await getData()
        .then(hide(document.querySelector("#search-panel")))
        .then(show(document.querySelector("#results-panel")))
        .then(printTable);
}

const goBack = function() {

    // show the search panel
    show(document.querySelector("#search-panel"));

    // hide the results panel
    hide(document.querySelector("#results-panel"));

}

const getData = async function() {

    // clear results
    results = {
        "movies" : [],
        "actors" : [],
    };

    await Promise.all(search.items.map(async item => {

        if (item.type === "movie") {

            // get movie
            let movieData = await getMovieOrShow(item.type, item.id);

            // get movie credits data
            let creditsData = await getMovieCredits(item.type, item.id);

            // add actors to result set
            creditsData.cast.forEach(person => {

                // if actor doesn't exist, add to the list
                if (results.actors.filter(function(e) { return e.id === person.id; }).length === 0) {

                    let actorData = {
                        "id" : person.id,
                        "image" : handleImage(person.profile_path),
                        "name" : person.name,
                        "roles" : [],
                    };

                    results.actors.push(actorData);

                }       
                
                // get actor object
                actorIndex = results.actors.findIndex((actor => actor.id == person.id));
                
                if (person.character != "")
                {
                    // need to check if role already exists
                    if (results.actors[actorIndex].roles.filter(function(e) { return e.movie_id === item.id; }).length === 0) {

                        let role = {
                            "movie_id" : item.id,
                            "role_description" : person.character,
                        };

                        results.actors[actorIndex].roles.push(role);

                    }  
                }              

            });
        }
        else {

            // get tv show
            let tvData = await getMovieOrShow(item.type, item.id);

            // iterate over show seasons
            tvData.seasons.forEach(async season => {

                // get season data
                let tvSeasonData = await getTvSeason(item.type, item.id, season.season_number);

                // iterate over season episodes
                tvSeasonData.episodes.forEach(async episode => {

                    // get episode credits data
                    let tvSeasonEpisodeCreditsData = await getTvSeasonEpisodeCredits(item.type, item.id, season.season_number, episode.episode_number);

                    // add actors to result set
                    tvSeasonEpisodeCreditsData.cast.forEach(async person => {
                        
                        // if actor doesn't exist, add to the list
                        if (results.actors.filter(function(e) { return e.id === person.id; }).length === 0) {

                            let actorData = {
                                "id" : person.id,
                                "image" : handleImage(person.profile_path),
                                "name" : person.name,
                                "roles" : [],
                            };

                            results.actors.push(actorData);

                        }       
                        
                        // get actor object
                        actorIndex = results.actors.findIndex((actor => actor.id == person.id));
                        
                        if (person.character != "")
                        {
                            // need to check if role already exists
                            if (results.actors[actorIndex].roles.filter(function(e) { return e.movie_id === item.id; }).length === 0) {

                                let role = {
                                    "movie_id" : item.id,
                                    "role_description" : `${person.character}`,
                                };

                                results.actors[actorIndex].roles.push(role);

                            }
                        } 
                    });

                    if (tvSeasonEpisodeCreditsData.guest_stars)
                    {
                        tvSeasonEpisodeCreditsData.guest_stars.forEach(async person => {
                            
                            // if actor doesn't exist, add to the list
                            if (results.actors.filter(function(e) { return e.id === person.id; }).length === 0) {

                                let actorData = {
                                    "id" : person.id,
                                    "image" : handleImage(person.profile_path),
                                    "name" : person.name,
                                    "roles" : [],
                                };

                                results.actors.push(actorData);

                            }       
                            
                            // get actor object
                            actorIndex = results.actors.findIndex((actor => actor.id == person.id));
                            
                            if (person.character != "")
                            {
                                // need to check if role already exists
                                if (results.actors[actorIndex].roles.filter(function(e) { return e.movie_id === item.id; }).length === 0) {

                                    let role = {
                                        "movie_id" : item.id,
                                        "role_description" : `${person.character}, S${season.season_number}E${episode.episode_number}`,
                                    };

                                    results.actors[actorIndex].roles.push(role);

                                }
                            }                
                        });
                    }
                });
            });   
        }
    }));
}
