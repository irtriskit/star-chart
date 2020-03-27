const image_path = "https://image.tmdb.org/t/p/original";

const handleImage = function (image) {
    if (image)
    {
        return `${image_path}${image}`;
    } else {
        return "assets/images/placeholder.png";
    }
}

const printTable = function () {
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
    
    search.items.forEach(movie => {
        html += "           <th>";
        html += getMovieComponent(movie);
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
            html += "           <td>";
            html += getActorComponent(actor);
            html += "           </td>";

            search.items.forEach(movie => {

                html += "           <td>";

                let role = actor.roles.filter(function(e) { return e.movie_id === movie.id; });

                if (role.length > 0) {
                    html += getRoleComponent(role[0]);
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
