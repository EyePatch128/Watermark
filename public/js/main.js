function updateDownloadLink(url){
    const a = document.getElementById('download-link');
    const title = document.getElementById("download-title");
    title.classList.remove("hidden")
    title.classList.add("visible")

    a.classList.remove("hidden")
    a.classList.add("visible")
    a.href = url;

    const name = url.split("/")[url.split("/").length-1];
    a.download = name;
    a.innerHTML = name;
}

function showLoader(){
    const loader = document.getElementsByClassName("loader")[0];
    const cover = document.getElementsByClassName("loader-cover")[0];

    loader.style.display = "block"
    cover.style.display = "block"
}
function hideLoader(){
    const loader = document.getElementsByClassName("loader")[0];
    const cover = document.getElementsByClassName("loader-cover")[0];

    loader.style.display = "none"
    cover.style.display = "none"
}

function handleSubmit(e){
    e.preventDefault();
    const data = new FormData(e.target);

    showLoader();

    fetch("/merge", {
        method: "POST",
        body: data
    })
    .then(res=>res.blob())
    .then(blob=>{
        hideLoader()
        const url = window.URL.createObjectURL(blob);
        updateDownloadLink(url)
    })
    .catch(err=>{
        throw err;
    })
}

let stateCheck = setInterval(() => {
    if (document.readyState === 'complete') {
      clearInterval(stateCheck);
      document.getElementsByClassName("form")[0].addEventListener("submit", handleSubmit)
    }
  }, 100);