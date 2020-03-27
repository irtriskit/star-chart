const api_key = "5eb10b8767980a1dc795085504be699c";
const api_path = "https://api.themoviedb.org/3";
const image_path = "https://image.tmdb.org/t/p/original";

let results = {
    "movies" : [],
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
        let name = (result.media_type === 'movie') ? result.title : result.name;
        let release_date = (result.media_type === 'movie') ? new Date(Date.parse(result.release_date)) : new Date(Date.parse(result.first_air_date));
        let image = "";

        if (result.poster_path)
        {
            image = `${image_path}${result.poster_path}`;
        } else {
            image = "assets/images/placeholder.png";
        }

        html += `<li onclick="addSearchItem(this)" class="find-result" data-type="${result.media_type}" data-id="${result.id}" data-name="${name}" data-image="${image}" data-release-date="${release_date}"><img alt="${name}" src="${image}" /> ${name} (${getMediaTypeDescription(result.media_type)}) [${release_date.getFullYear()}]</li>`;
        counter++

        // only want to add first 6 items
        if (counter > 5) {
          break;
        }
    }

    html += "</ul>";

    let el = document.querySelector("#auto-complete-results");
    el.innerHTML = html;
}

const getMediaTypeDescription = function (type) {
    return(type === 'movie') ? "Movie" : "TV Series";
}

const updateSearchItems = function() {

    let html = "";

    html += "<ul>";

    search.items.forEach(item => {
        html += `<li onclick="removeSearchItem(this)" class="item-to-search" data-type="${item.type}" data-id="${item.id}" data-name="${item.name}" data-image="${item.image}" data-release-date="${item.release_date}"><img alt="${item.name}" src="${item.image}" />${name} (${getMediaTypeDescription(item.type)}) [${item.release_date.getFullYear()}]</li>`;
    });

    html += "</ul>";

    let el = document.querySelector("#items-to-search");
    el.innerHTML = html;

}

const addSearchItem = function (el) {
    // TODO: prevent them from adding the same thing twice

    if (search.items.length < 6)
    {
        let item = {
            "type" : el.getAttribute("data-type"),
            "id" : parseInt(el.getAttribute("data-id")),
            "name" : el.getAttribute("data-name"),
            "image" : el.getAttribute("data-image"),
            "release_date" : new Date(el.getAttribute("data-release-date")),
        };
    
        search.items.push(item);
    
        updateSearchItems();
    } else {
        alert("You can only compare up to 6 items!");
    }

    clearAutoComplete();
}

const clearAutoComplete = function () {
    let el = document.querySelector("#auto-complete-results");
    el.innerHTML = "";

    el = document.querySelector("#search");
    el.value = "";
}

const removeSearchItem = function (el) {

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
    let doneTypingInterval = 2000;  //time in ms (2 seconds)
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

});

const getData = async function()
{
    // validate they have enough items
    if (search.items.length < 2) {
        alert("You have to compare at least 2 items!");
        return;
    }

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

            // save movie data for header
            let movie = {
                "id" : item.id,
                "image" : movieData.poster_path,
                "name" : movieData.title,
                "type" : "Movie",
            };

            results.movies.push(movie);

            // add actors to result set
            creditsData.cast.forEach(person => {

                // if actor doesn't exist, add to the list
                if (results.actors.filter(function(e) { return e.id === person.id; }).length === 0) {

                    let actorData = {
                        "id" : person.id,
                        "image" : person.profile_path,
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

            // save tv show data for header
            let tvShow = {
                "id" : item.id,
                "image" : tvData.poster_path,
                "name" : tvData.name,
                "type" : "TV Series",
            };

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
                                "image" : person.profile_path,
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
                                    "image" : person.profile_path,
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

            results.movies.push(tvShow);

        }
    }))
    .then(printTable);
}

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

const printTable = function()
{
    let html = "";

    html += "<table>";
    html += "   <thead>";
    html += "       <tr class='header-row'>";

    html += "           <th>";
    // html += "               Sort by:";
    // html += "               <select>";
    // html += "                   <option>Matches Most-Least</option>";
    // html += "                   <option>Matches Least-Most</option>";
    // html += "                   <option>Name A-Z</option>";
    // html += "                   <option>Name Z-A</option>";
    // html += "               </select>";
    html += "           </th>";
    
    results.movies.forEach(movie => {
        html += "           <th>";
        // TODO: add first_air_date/release_date
        html += `               <img alt="${movie.name}" src="${image_path}/${movie.image}" />`;
        html += `               <span class="subtitle">(${movie.type})</span>`;
        html += "           </th>";
    });

    html += "       </tr>";
    html += "   </thead>";
    html += "   <tbody>";

    results.actors.forEach(actor => {

        // only show actors that match more than one movie
        if (actor.roles.length > 1)
        {
            html += "       <tr class='actor-row'>";
            html += "           <td class='actor'>";
            html += (actor.image) ?  `<img src="${image_path}/${actor.image}" />` : "";
            html += `               <h3>${actor.name}</h3>`;
            html += "           </td>";

            results.movies.forEach(movie => {

                html += "           <td class='role'>";

                let role = actor.roles.filter(function(e) { return e.movie_id === movie.id; });

                if (role.length > 0) {
                    html += "               <div class='tooltip'><span class='star'>&#9733</span>";
                    html += `                   <span class="tooltiptext">${role[0].role_description}</span>`;
                    html += "               </div>";
                }

                html += "           </td>";

            })

            html += "       </tr>";

        }
    });

    html += "   </tbody>";
    html += "</table>";

    let el = document.querySelector("#results");
    el.innerHTML = html;
}
