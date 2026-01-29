const form = document.getElementById('search-form');
const input = document.getElementById('user-input')
const profileDiv = document.getElementById('profile');
const loadingText = document.getElementById('loading');
const errorText = document.getElementById('error');
const reposDiv = document.getElementById("repos");
const modeToggle = document.getElementById("mode-toggle");
const searchMode = document.getElementById("search-mode");
const battleMode = document.getElementById("battle-mode");
const battleForm = document.getElementById("battle-form");
const battleResult = document.getElementById("battle-result");



form.addEventListener("submit", (e) => {
    e.preventDefault();

    const username = input.value.trim();

    if (username !== "") {
        fetchUser(username);
    }

});

modeToggle.addEventListener("change", ()=>{

    if(modeToggle.checked){
        searchMode.classList.add("hidden");
        battleMode.classList.remove("hidden");
    } else {
        battleMode.classList.add("hidden");
        searchMode.classList.remove("hidden")
    }
});

battleForm.addEventListener("submit", (e)=>{
    e.preventDefault();

    const user1= document.getElementById("user1").value.trim();
    const user2 = document.getElementById("user2").value.trim();

    if(user1&&user2){
        startBattle(user1, user2);
    }
});

async function startBattle(userA, userB) {

    battleResult.classList.remove("hidden");
    battleResult.innerHTML= `<p>⚔ Battling...</p>`;

    try{
        const[dataA, dataB] = await Promise.all([
            fetchUserForBattleFull(userA),
            fetchUserForBattleFull(userB),
        ]);

        const winner = 
        dataA.totalStars > dataB.totalStars ?dataA: dataB;

        const loser = 
        winner === dataA? dataB : dataA;

        showBattleResult(winner, loser);
    }catch(error){
        battleResult.innerHTML=`
        <p class="battle-error">Battle failed. One or Both user not found!</p>`;
    }
    
}

async function fetchUser(username) {

    showLoading();

    try {

        const response = await fetch(
            `https://api.github.com/users/${username}`
        );
        if (!response.ok) {
            throw new Error("User not found!")
        }
        const data = await response.json();
        showProfile(data);

        fetchRepos(data.repos_url);

    } catch (error) {
        showError(error.message);
    }

}

async function fetchUserForBattleFull(username) {

    const userRes= await fetch(
        `https://api.github.com/users/${username}`
    );

    if(!userRes.ok){
        throw new Error("User not found");
    }

    const user = await userRes.json();

    const repoRes = await fetch(user.repos_url);
    const repos = await repoRes.json();

    const totalStars = repos.reduce(
        (sum, repo) => sum+ repo.stargazers_count, 0
      
    );

      const latestRepos = repos
    .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
    .slice(0, 5);

    return{
          login: user.login,
    avatar: user.avatar_url,
    bio: user.bio,
    created: user.created_at,
    profileUrl: user.html_url,
    totalStars,
    latestRepos,
    };
    
}

async function fetchRepos(reposUrl) {
    try {
        const response = await fetch(reposUrl);

        const repos = await response.json();

        if (!Array.isArray(repos)) {
            console.log("Not array:", repos);
            return;
        }

        const latestRepos = repos
            .sort((a, b) => new Date(b.updated_at) - new Date(a.updated_at))
            .slice(0, 5);
        showRepos(latestRepos);
    } catch (error) {
        console.log("Repo fetch failed", error);
    }
}

function showRepos(repos) {
    reposDiv.innerHTML = "<h3>Latest Repositories</h3>";

    repos.forEach((repo) => {
        const date = formatDate(repo.updated_at);
        reposDiv.innerHTML += `
            <div class="repo-item">
            <a href="${repo.html_url}" target="_blank">${repo.name}</a><br>
            <span>Updated: ${date}</span>
            </div>          
            `;

    });
    reposDiv.classList.remove("hidden");
}

function formatDate(dateString) {
    const date = new Date(dateString);

    return date.toLocaleDateString("en-GB", {
        day: "2-digit",
        month: "short",
        year: "numeric",
    });
}

function showProfile(user) {
    hideLoading();
    errorText.classList.add("hidden");

    profileDiv.innerHTML = `
        <img src="${user.avatar_url}" alt="avatar" />
        <h2>${user.name || user.login}</h2><br>
        <p>${user.bio || "No Bio available"}</p><br>
        <p>Joined: ${new Date(user.created_at).toDateString()}</p><br>
        <a href="${user.html_url}" target="_blank">Visit Profile</a>

    `;
    profileDiv.classList.remove("hidden");

}

function showBattleResult(winner, loser) {
  battleResult.innerHTML = "";

  [winner, loser].forEach((user, index) => {
    const isWinner = index === 0;

    const card = document.createElement("div");
    card.className = `battle-user`;

    card.innerHTML = `
      <div class="profile ${isWinner ? "winner" : "loser"}" >
        <img src="${user.avatar}">
        <h3>${user.login}</h3>
        <p>${user.bio || "No Bio available"}</p>
        <p>Joined: ${new Date(user.created).toDateString()}</p>
        <p>⭐ Total Stars: ${user.totalStars}</p>
        <a href="${user.profileUrl}" target="_blank">Visit Profile</a>
      </div> 

      <div class="repos">
        <h3>Latest Repositories</h3>
        ${(user.latestRepos && user.latestRepos.length) > 0 
            ? user.latestRepos
          .map(
            (repo) => `
            <div class="repo-item">
              <a href="${repo.html_url}" target="_blank">${repo.name}</a>
              <br>
              <span>Updated: ${formatDate(repo.updated_at)}</span>
            </div>
          `
          )
          .join("")
          : `<p class="no-repo"> No Repositories are available in this Account.</p>`
        }
      </div>
    `;

    battleResult.appendChild(card);
  });
}


function showError(message) {
    hideLoading();
    profileDiv.classList.add("hidden");
    reposDiv.classList.add("hidden");

    errorText.textContent = message;
    errorText.classList.remove("hidden");

}

function showLoading() {
    loadingText.classList.remove("hidden");
    errorText.classList.add("hidden");
    profileDiv.classList.add("hidden");
    reposDiv.classList.add("hidden");

}

function hideLoading() {
    loadingText.classList.add("hidden");
}