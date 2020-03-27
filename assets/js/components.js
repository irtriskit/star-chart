const getMovieComponent = function (movie) {

    let html = "";

    html += `   <div class="movie">`;
    html += `       <img class="movie-image" alt="${movie.name}" src="${movie.image}" />`;
    html += `       <span class="movie-title">${movie.name}</span>`;
    html += `       <span class="movie-type">(${getMovieTypeDescription(movie.type)})</span>`;
    html += `       <span class="movie-release-year">[${movie.release_year}]</span>`;
    html += `   </div>`;

    return html;

}

const getMovieTypeDescription = function (type) {return(type === 'movie') ? "Movie" : "TV Series"};

const getActorComponent = function (actor) {

    let html = "";

    html += `   <div class="actor">`;
    html += `       <img class="actor-image" alt="${actor.name}" src="${actor.image}" />`;
    html += `       <span class="actor-name">${actor.name}</span>`;
    html += `   </div>`;

    return html;

}

const getRoleComponent = function (role) {

    let html = "";

    html += `   <div class="role">`;
    html += `       <div class='tooltip'><span class='star'>&#9733</span>`;
    html += `           <span class="tooltiptext">${role.role_description}</span>`;
    html += `       </div>`;
    html += `   </div>`;

    return html;

}
