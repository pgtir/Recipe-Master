// <--------------- ELEMENT SELECTORS --------------------->
const mainView = document.querySelector(".blue");
const homeHeader = document.querySelector(".home");
const highlights = document.querySelector(".highlights");
const searchInputs = document.querySelectorAll(".search-input");
const homeSearch = document.querySelector(".home-search");
const recipePageSearch = document.querySelector(".recipe-page-search");
const greeting = document.querySelector(".greeting");
const dynamicNavTextDivText = document.querySelector(".dynamic-nav-text");
const trendingList = document.querySelector(".list-item-group");
const cancelRecipeUpload = document.querySelector(".cancel-btn");
const btnRecipeUpload = document.querySelector(".upload-btn");
const bookmarkBtn = document.querySelector(".bookmarks-link");
const homeLink = document.querySelector(".home-link");
const trendingLink = document.querySelector(".trending-link");
const uploadRecipeLink = document.querySelector(".add-recipe");
const bookmarksLink = document.querySelector(".bookmarks-link");
const feedbackLink = document.querySelector(".feedback-link");
const modalContainer = document.querySelector(".modal-container");
const user = document.querySelector(".user");
const recipeUploadForm = document.querySelector(".recipe-details-form");
const trendingHead = document.querySelector(".heading-container");
const formInputs = document.querySelectorAll(".formInput");

// <---------------- SOME GLOBAL VARIABLES------------------>
const url = "https://forkify-api.herokuapp.com/api/v2/recipes";
const KEY = '1c4251f9-16bd-45e7-be07-1604b180ba97';
const bookmarks = [];
homeLink.classList.add("active");

let recipeAreaLoading = false;
let id = "5ed6604591c37cdc054bc";
const arrIds = [
  `${id + "b2d"}`,
  `${id + "cff"}`,
  `${id + "d29"}`,
  `${id + "d1f"}`,
  `${id + "f56"}`,
  `${id + "b5e"}`,
  `${id + "af5"}`,
  `${id + "b49"}`,
  `${id + "d16"}`,
  `${id + "d15"}`,
  `${id + "ebc"}`,
  `${id + "c51"}`,
  `${id + "f5e"}`,
  `${id + "cae"}`,
  `${id + "c47"}`,
  `${id + "eaa"}`,
  `${id + "bf4"}`,
  `${id + "ef3"}`,
  `${id + "94c"}`,
  `${id + "9ac"}`,
  
];
let count = 0;
renderHomePage();

// <--------------------- EVENT LISTENERS -------------------->
window.addEventListener("hashchange", () => {
  if (window.location.hash == "#home") {
    renderHomePage();
    homeHeaderSection();
    homeLink.classList.add("active");
    bookmarksLink.classList.remove("active");
    feedbackLink.classList.remove("active");
    uploadRecipeLink.classList.remove("active");
    homeHeaderSection();
  }
});

searchInputs.forEach((input) => {
  input.addEventListener("keypress", (e) => {
    if (e.key === "Enter") {
      keyPressSearch = true;
      (async function () {
        let recipes;
        try {
          recipes = await loadSearchResults(e.target.value);
        } catch {
        } finally {
          renderSearchResults(recipes);
          highlights.scrollTo(0, 0);
          searchResultsHeader();
          clearInputBox();
        }
      })();
    }
  });
});

window.addEventListener("hashchange", () => {
  if (window.location.hash == "#bookmarks") {
    bookmarksLink.classList.add("active");
    homeLink.classList.remove("active");
    feedbackLink.classList.remove("active");
    uploadRecipeLink.classList.remove("active");
    renderBookmarks();
  }
});
feedbackLink.addEventListener("click", ()=> {
  feedbackLink.classList.add("active");
  homeLink.classList.remove("active");
  uploadRecipeLink.classList.remove("active");
  console.log(bookmarksLink);
  bookmarksLink.classList.remove("active");
  renderSpinner('highlights');
  setTimeout(() => {
    (async function(){
      if(!pulledFeedbackData){
         data = await pullFeedback();
         pulledFeedbackData = true;
        }
        renderFeedbackThread(data);
        renderRecipeSectionHeader();     
        dynamicNavTextDivText.innerText = 'Drop your Feedback'
        recipePageSearch.style.display = 'none';
        homeSearch.style.display = 'block';
    })();
  }, 1000);
})
uploadRecipeLink.addEventListener("click", () =>{
  clearInputBox();
  modalContainer.style.display = 'flex';
  cancelRecipeUpload.style.display = 'block';
  user.style.zIndex = '0';
  trendingHead.style.zIndex = '0';
  changeUploadBtn(false);
  uploadRecipeLink.classList.add("active");
  homeLink.classList.remove("active");
  bookmarksLink.classList.remove("active");
  feedbackLink.classList.remove("active");
  uploadRecipeLink.classList.remove("active");
  cancelRecipeUpload.addEventListener("click", ()=> {
    closeFormModal();
  })
})

// // <------------------------ UPLOAD RECIPE JS ------------------------------>
function changeUploadBtn(isUploaded) {
  btnRecipeUpload.innerText = isUploaded ? 'UPLOADED!' : 'UPLOAD';
  if(isUploaded) btnRecipeUpload.classList.add("green");
  else btnRecipeUpload.classList.remove("green");
}

function closeFormModal() {
  modalContainer.style.display = 'none';
  user.style.zIndex = '1';
  trendingHead.style.zIndex = '1';
}



recipeUploadForm.addEventListener("submit", (e)=> {
  e.preventDefault();
  const dataArr = [...new FormData(recipeUploadForm)];
  const data = Object.fromEntries(dataArr);
  manageNewRecipe(data);
})
const manageNewRecipe = async function(newRecipe) {
 try {
   btnRecipeUpload.innerText = 'Please Wait...';
   cancelRecipeUpload.style.display = 'none';
  const recipe = await uploadNewRecipe(newRecipe);
  changeUploadBtn(true);
  renderRecipe(recipe);
  renderRecipeSectionHeader();
  dynamicNavTextDivText.innerText = "You just uploaded this recipe...";
  window.history.pushState(null,'', `#${recipe.id}`);
  setTimeout(() => {
    closeFormModal();
  }, 1000);
 }
 catch(err) {
   console.log(err);
 }

}
const uploadNewRecipe = async function(newRecipe) {
  try{
    const ingredients = Object.entries(newRecipe)
    .filter(entry => entry[0].startsWith('ingredient') && entry[1] !== '')
    .map(ing => {
      const ingArr = ing[1].split(',').map(el => el.trim());
      if (ingArr.length !== 3)
        throw new Error(
          'Wrong ingredient fromat! Please use the correct format :)'
        );
      const [quantity, unit, description] = ingArr;
      return { quantity: quantity ? +quantity : null, unit, description };
    });
    let recipe = {
      title: newRecipe.title,
      source_url: newRecipe.sourceUrl,
      image_url: newRecipe.image,
      publisher: newRecipe.publisher,
      cooking_time: +newRecipe.cookingTime,
      servings: +newRecipe.servings,
      ingredients,
    };
    // SENDING JSON TO THE API (and then the api also sends the same data back )
    const response = await fetch(`${url}?key=${KEY}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(recipe)
    });
    const data = await response.json();
    console.log(response);
    recipe = createRecipeObject(data);
    return recipe;
  }
  catch(err) {
    console.log(err);
  }
}
// <------------------RENDER HOME PAGE------------------>
function renderHomePage() {
  const html = `<section class="home pb-3">
 <header class="p-4  shadow-sm mt-1 mb-4">
   <div class="header-img">
     <img src="images/Chef-male.png" class="img-fluid" alt="">
   </div>
   <div class="header-content px-3">
     <h2 class="head">
       Become a Master Chef right at home!
     </h2>
     <p>We bring you hundreds of tasty recipes so your meal becomes just the best</p>
   </div>
 </header>
 <section class="meal-time  mb-4">
   <div class="p-5 py-2 shadow lunch">Lunch</div>
   <div class="p-5 py-2 shadow breakfast">Breakfast</div>
   <div class="p-5 py-2 shadow dinner">Dinner</div>
   <div class="p-5 py-2 shadow deserts">Deserts</div>
 </section>
 <section class="meal-items row justify-content-between">
 </section>
</section> `;
  mainView.innerHTML = "";
  mainView.innerHTML = html;
  renderHomePagePro();
  if (count != 0) showInitialRecipes(arrIds.slice(0,4));
}
function renderHomePagePro() {
  const lunchMeal = document.querySelector(".lunch");
  const dinnerMeal = document.querySelector(".dinner");
  const breakfastMeal = document.querySelector(".breakfast");
  const desertsMeal = document.querySelector(".deserts");
  breakfastMeal.classList.add("active-meal");
  lunchMeal.addEventListener("click", ()=> {
    breakfastMeal.classList.remove("active-meal");
    lunchMeal.classList.add("active-meal");
    dinnerMeal.classList.remove("active-meal");
    desertsMeal.classList.remove("active-meal");
    showInitialRecipes(arrIds.slice(8,12));
  });
  breakfastMeal.addEventListener("click", ()=> {
    breakfastMeal.classList.add("active-meal");
    lunchMeal.classList.remove("active-meal");
    dinnerMeal.classList.remove("active-meal");
    desertsMeal.classList.remove("active-meal");
    showInitialRecipes(arrIds.slice(0,4));
  });
  dinnerMeal.addEventListener("click", ()=> {
    breakfastMeal.classList.remove("active-meal");
    lunchMeal.classList.remove("active-meal");
    dinnerMeal.classList.add("active-meal");
    desertsMeal.classList.remove("active-meal");
    showInitialRecipes(arrIds.slice(16));
  });
  desertsMeal.addEventListener("click", ()=> {
    breakfastMeal.classList.remove("active-meal");
    lunchMeal.classList.remove("active-meal");
    dinnerMeal.classList.remove("active-meal");
    desertsMeal.classList.add("active-meal");
    showInitialRecipes(arrIds.slice(12, 16));
  });
}
// <------------------------- RENDER TRENDING PAGE --------------->

function renderTrendingPage(trendingRecipes) {
  const html = ` ${trendingRecipes
    .map((rec) => {
      return ` <a class="item-preview-link" href="#${rec.id}">
      <div class="list-item shadow mb-3 p-3 d-flex flex align-items-center  text-center">
      <div class="item-img ">
        <img src="${rec.image}" class="img-fluid shadow-sm" alt="Recipe-image">
      </div>
      <div class="item-content text-start">
        <div class="item-info">
          <div class="item-name">${rec.title}</div>
          <div class="item-about">${rec.publisher}</div>
        </div>
        
      </div>
    </div> `;
    })
    .join("")}; 
      </a>
     
    `;
  trendingList.innerHTML = html;
}

// <-------------------------- RENDER MEAL ITEMS AREA ------------->
function renderMealItemsArea(mealRecipes) {
  const mealItemsArea = document.querySelector(".meal-items");
  console.log(mealItemsArea);
  const html = `
  <div class="meal shadow-sm me-sm-3 mb-3 col-12 col-sm-5 p-3 py-4 flex-fill">
  <a href="#${mealRecipes[0].id}" class="item-preview-link">
  <div class="top-info">
    <div class="credits">
      ${mealRecipes[0].publisher}
    </div>
    <div class="rating">
      <i class="far fa-star me-2"></i>4.8
    </div>
  </div>
  <div class="bottom-info">
    <div class="title mb-1">${mealRecipes[0].title}</div>
    <div class="time"><i class="far fa-clock me-2"></i>${mealRecipes[0].cookingTime} min</div>
  </div></a>
</div>

<div class="meal shadow-sm mb-3 col-12 col-sm-5 p-3 py-4 flex-fill">
<a href="#${mealRecipes[1].id}" class="item-preview-link ">
  <div class="top-info">
    <div class="credits">
    ${mealRecipes[1].publisher}
    </div>
    <div class="rating">
      <i class="far fa-star me-2"></i>4.8
    </div>
  </div>
  <div class="bottom-info">
    <div class="title mb-1">${mealRecipes[1].title}</div>
    <div class="time"><i class="far fa-clock me-2"></i>${mealRecipes[1].cookingTime} min</div>
  </div></a>
</div>

<div class="meal shadow-sm me-sm-3 mb-3 col-12 col-sm-5 p-3 py-4 flex-fill">
<a href="#${mealRecipes[2].id}" class="item-preview-link">
  <div class="top-info">
    <div class="credits">
    ${mealRecipes[2].publisher}
    </div>
    <div class="rating">
      <i class="far fa-star me-2"></i>4.8
    </div>
  </div>
  <div class="bottom-info">
    <div class="title mb-1">${mealRecipes[2].title}</div>
    <div class="time"><i class="far fa-clock me-2"></i>${mealRecipes[2].cookingTime} min</div>
  </div></a>
</div>

<div class="meal shadow-sm mb-3 col-12 col-sm-5 p-3 py-4 flex-fill">
<a href="#${mealRecipes[3].id}" class="item-preview-link">
  <div class="top-info">
    <div class="credits">
    ${mealRecipes[3].publisher}
    </div>
    <div class="rating">
      <i class="far fa-star me-2"></i>4.8
    </div>
  </div>
  <div class="bottom-info">
    <div class="title mb-1">${mealRecipes[3].title}</div>
    <div class="time"><i class="far fa-clock me-2"></i>${mealRecipes[3].cookingTime} min</div>
  </div></a> 
</div>`;
  mealItemsArea.innerHTML = html;
  const mealItems = document.querySelectorAll(".meal");
  for (let i = 0; i < 4; i++) {
    const meal = mealItems[i];
    const rec = mealRecipes[i];
    const bg = `background-image: radial-gradient(rgba(240, 240, 240, 0.089) , rgba(5, 5, 5, 0.767)), url('${rec.image}');`;
    meal.style = bg;
  }
}
// <--------------------- CLEAR INPUT BOX---------------------->
function clearInputBox() {
  formInputs.forEach(input => {
    input.value = "";
  }) ;
  searchInputs.forEach((input) => {
    input.value = "";
  });
}
// <------------------------ RENDER SPINNER -------------------->
function renderSpinner(section) {
  const mealItemsArea = document.querySelector(".meal-items");
  const html = ` <section class="spinner">
    <i class="fas fa-spinner"></i>
  </section> `;
  if (section == "highlights") {
    mainView.innerHTML = html;
  } else if (section == "trendingPage") {
    trendingList.innerHTML = html;
  } else if (section == "mealItemsArea") {
    mealItemsArea.innerHTML = html;
  } 
}
// <----------------------- LOAD SEARCH RESULTS ----------------->
const loadSearchResults = async function (query) {
  try {
    renderSpinner("highlights");
    const response = await fetch(`${url}?search=${query}&key=${KEY}`);
    const data = await response.json();
    const recipes = data.data.recipes.map((rec) => {
      return {
        id: rec.id,
        title: rec.title,
        publisher: rec.publisher,
        image: rec.image_url,
        ...(rec.key && { key: rec.key }),
      };
    });
    return recipes;
  } catch (err) {
    console.log(err);
  } finally {
    window.location.hash = `search-${query}`;
  }
};

function homeHeaderSection() {
  homeSearch.style.display = "block";
  recipePageSearch.style.display = "none";
  greeting.style.display = "flex";
  dynamicNavTextDivText.style.display = "none";
}
function searchResultsHeader() {
  homeSearch.style.display = "none";
  greeting.style.display = "none";
  recipePageSearch.style.display = "block";
  dynamicNavTextDivText.style.display = "none";
}
// <------------------ RENDER RECIPE ----------------------->
function renderRecipe(recipe) {
  console.log(recipe.sourceUrl);
  const html = ` <section class="recipe">
    <div class="recipe-intro pe-4 shadow-sm py-3">
      <div class="image">
        <img class="img-fluid shadow" src="${
          recipe.image
        }" alt="recipe-item-image">
      </div>
      <div class="content  mb-5">
        <div class="title ps-3">${recipe.title}</div>
        <div class="credit ps-3 mb-3">${recipe.publisher}</div>
        <div class="info">Lorem, ipsum dolor sit amet consectetur adipisicing elit. Harum, dicta quidem nemo voluptatibus rem quasi saepe, nulla, quam dignissimos magni eum. Fuga laborum iste vel tempore quo ut aliquam deserunt.</div>
      </div>
      <div class="activity w-100 mb-4">
        <div class="add-favourite shadow-sm activity-btns p-1 ">${
          recipe.bookmarked ? "Remove Bookmark" : "Bookmark recipe"
        } <i class="${
    recipe.bookmarked ? "fas" : "far"
  } fa-bookmark ms-2"></i></div>
       </div>
      <div class="about">
        <div class="about-items">
          <div class="num">${recipe.cookingTime}</div>
          <div class="time word">minutes</div>
        </div>
        <div class="about-items">
          <div class="num">4.5</div>
          <div class="rating word">rating</div>
        </div>
        <div class="about-items">
          <div class="num">700</div>
          <div class="likes word">Likes</div>
        </div>
        <div class="about-items">
          <div class="num">1K</div>
          <div class="views word">views</div>
        </div>
      </div>
    </div>
    <div class="line shadow-sm"></div>
    <div class="ingredients shadow-sm  px-3 pb-0 pt-3">
      <div class="title p-1 text-center">Ingredients</div>
      <div class="servings-container text-center mb-3">
        <div class="servings me-3 text-center"><i class="fas fa-users me-2"></i>Servings :</div>
            <div class="plus-minus">
                <div class="minus btn-update-servings" data-update-to="${
                  recipe.servings - 1
                }"><i class="fas fa-minus p-1 me-2"></i></div>
                <div class="num servings-num px-1 mt-1">${recipe.servings}</div>
                <div class="plus btn-update-servings" data-update-to="${
                  recipe.servings + 1
                }"><i class="fas fa-plus p-1 ms-2"></i></div>
            </div>
        </div>
      <ul class="mb-0">
        ${recipe.ingredients
          .map((ing) => {
            return `<li class="mb-3">
            <div class="finger">
              <i class="far fa-hand-point-right me-3 "></i>
            </div>
            <div class="info">
            ${ing.quantity ? ing.quantity : ""} ${ing.unit} ${ing.description}
            </div>
          </li>`;
          })
          .join("")}
      </ul>
      <div class="directions text-center p-2 mb-3"><a href="#${recipe.sourceUrl}"> Directions to Cook!</a></div>
    </div>
  </section> `;
  mainView.innerHTML = html;
  dynamicNavTextDivText.innerText = "Here is your Master Recipe!😋";
  handleServings(recipe);
  handleBookmarks(recipe);
}

//<------------------------- HANDLE BOOKMARKS ---------------------->
function handleBookmarks(recipe) {
  const bookmarkBtn = document.querySelector(".add-favourite");
  bookmarkBtn.addEventListener("click", () => {
    let html;
    if (!recipe.bookmarked) {
      bookmarks.push(recipe);
      recipe.bookmarked = true;
    } else {
      console.log(recipe);
      const index = bookmarks.findIndex((bookmark) => bookmark.id == recipe.id);
      bookmarks.splice(index, 1);
      recipe.bookmarked = false;
      console.log(bookmarks);
    }
    html = `${recipe.bookmarked ? "Remove Bookmark" : "Bookmark"} <i class="${
      recipe.bookmarked ? "fas" : "far"
    } fa-bookmark ms-2"></i>`;
    bookmarkBtn.innerHTML = html;
  });
}

function renderBookmarks() {
  const html = `
  <section class="bookmarks mb-5">
  ${bookmarks
    .map((bookmark) => {
      return `
    <div class="bookmark-item shadow-sm  px-3 pb-3">
    <div class="div d-flex align-items-center justify-content-between">
      <div class="bookmark-img d-inline-block">
        <img src="${bookmark.image}" class="shadow-sm" alt="">
      </div>
    </div>
    <div class="delete-bookmark d-flex justify-content-end align-items-center mt-2">
      <div class="del-bookmark-btn shadow-sm p-1 px-3 d-flex align-items-center" data-remove-id="${bookmark.id}">
        <span>Remove</span>
      </div>
    </div>
    <div class="bookmark-content">
      <div class="title  my-1">${bookmark.title}</div>
      <div class="credit">${bookmark.publisher}</div>
    </div>
    <a href="#${bookmark.id}" class="shadow-sm item-preview-link d-block w-100 mt-4">
      <div class="open-recipe text-center p-2">
        Open Recipe
      </div>
    </a>  
  </div>`;
    })
    .join("")}
  </section>  `;
  mainView.innerHTML = html;
  renderRecipeSectionHeader();
  dynamicNavTextDivText.innerText = "Review your Bookmarks";
  window.location.hash = "#bookmarks";
  const removeBookmarkBtns = document.querySelectorAll(".del-bookmark-btn");
  removeBookmarkBtns.forEach((remove) => {
    remove.addEventListener("click", () => {
      const { removeId } = remove.dataset;
      const index = bookmarks.findIndex((bookmark) => bookmark.id == removeId);
      bookmarks[index].bookmarked = false;
      bookmarks.splice(index, 1);
      renderBookmarks();
    });
  });
}

// <----------------------- LOAD RECIPE ------------------------->
const createRecipeObject = function(data) {
  const { recipe } = data.data;
  return {
      id: recipe.id,
      title: recipe.title,
      publisher: recipe.publisher,
      image: recipe.image_url,
      cookingTime: recipe.cooking_time,
      sourceUrl: recipe.source_url,
      servings: recipe.servings,
      ingredients: recipe.ingredients,
      ...(recipe.key && { key: recipe.key }),
  };
}

const loadRecipe = async function (id) {
  try {
    if (recipeAreaLoading) {
      renderSpinner("highlights");
    }
    const response = await fetch(
      ` https://forkify-api.herokuapp.com/api/v2/recipes/${id}?key=${KEY} `
    );
    const data = await response.json();
    const recipe = createRecipeObject(data);

    if (bookmarks.some((bookmark) => bookmark.id == id))
      recipe.bookmarked = true;
    else recipe.bookmarked = false;
    return recipe;
  } catch (err) {
    console.log(err);
  } finally {
    recipeAreaLoading = false;
  }
};

// <-------------------SHOW INITIAL RECIPES--------------------->
function showInitialRecipes(arrIds) {
  const arrRecipes = [];
  (async function () {
    let recipe;
    try {
      if (count == 0) renderSpinner("trendingPage");
       renderSpinner("mealItemsArea");
      for (let i in arrIds) {
        recipe = await loadRecipe(arrIds[i]);
        arrRecipes.push(recipe);
        console.log(arrRecipes);
        if(i == 3) renderMealItemsArea(arrRecipes);
      }
    } catch (err) {
      console.log(err);
    } finally {
      if (count == 0) {
        renderTrendingPage(arrRecipes.slice(4));
      }
      count++;
    }
  })();
}
if (count == 0) showInitialRecipes(arrIds);


// <---------------------------LISETNEING HASHCHANGE EVENT FOR LOADING RECIPE---------------------------->
function checkFirstLetterNumber(str) {
  return /^\d/.test(str);
}
window.addEventListener("hashchange", () => {
  const id = window.location.hash.slice(1);
  if (checkFirstLetterNumber(id)) {
    (async function () {
      let recipe;
      try {
        recipeAreaLoading = true;
        recipe = await loadRecipe(id);
      } catch {
      } finally {
        renderRecipe(recipe);
        highlights.scrollTo(0, 0);
        renderRecipeSectionHeader();
        clearInputBox();
      }
    })();
  }
});
// <------------------------------------ HANDLE SERVINGS --------------------------------->
function handleServings(recipe) {
  const updateServingsBtns = document.querySelectorAll(".btn-update-servings");
  updateServingsBtns.forEach((btn) => {
    btn.addEventListener("click", () => {
      const { updateTo } = btn.dataset;
      // +updateTo is just converting string to number and not incrementing it(of course cant increment a string!)
      if (+updateTo > 0) updateServings(+updateTo, recipe);
    });
  });
}

function updateServings(newServings, recipe) {
  recipe.ingredients.forEach((ing) => {
    // Calculation -> Ratio of newQuantity : Old quantity = Ratio of newServings : Old Servings
    ing.quantity = (ing.quantity * newServings) / recipe.servings;
  });
  recipe.servings = newServings;
  renderRecipe(recipe);
}
// <----------------------------- RECIPE SECTION HEADER -----------------------------------> 
function renderRecipeSectionHeader() {
  homeSearch.style.display = "none";
  recipePageSearch.style.display = "block";
  greeting.style.display = "none";
  dynamicNavTextDivText.style.display = "block";
}
// <-------------------- RENDER SEARCH RESULTS ---------------->
function renderSearchResults(recipes) {
  const html = ` <section class="search-results">
    ${recipes
      .map((rec) => {
        return `  <a class="item-preview-link" href="#${rec.id}">
        <div class="result mb-3 shadow">
        <div class="result-img overflow-hidden ">
          <img src="${rec.image}" class="img-fluid shadow-sm" alt="">
        </div>
        <div class="result-content p-4 ">
          <div class="result-info text-start">
            <div class="title">${rec.title}</div>
            <div class="credit">${rec.publisher}</div>
          </div>
          <div class="result-rating">
            <div class="likes">${`${Math.floor((Math.random() * 10) + 1)}`}K views</div>
            <div class="bullet">•</div>
            <div class="time">${rec.key? "Today" : "1 week ago"}</div>
          </div>
        </div>
      </div>
        </a>
         `;
      })
      .join("")};
  </section> `;
  mainView.innerHTML = html;
}

// <------------------------ FEEDBACK THREAD PAGE ------------------------->
const pullFeedback = async function () {
  const res = await fetch("reviews-data.json");
  const data = await res.json();
  return data;
};
let pulledFeedbackData = false;
let data;

let replyBoxOpen = 0;
function renderFeedbackThread(feedbackData) {
  const currentUser = feedbackData.currentUser;
  const comments = feedbackData.comments;
  const html = ` <section class="reviews mb-5 px-0 mx-3 px-md-5 mx-md-5">
  ${comments
    .map((comm) => {
      return ` <div class="comment-container mb-3">
  <div class="comment shadow-sm p-4">
    <div class="image">
      <img src="${comm.user.image}" alt="">
    </div>
    <div class="text-content">
      <div class="content mb-3">
        <div class="top mb-2">
          <div class="name">${comm.user.username}<span class="${
        currentUser.username == comm.user.username ? "d-inline-block" : "d-none"
      } you ms-2 px-2">you</span> <span class="time ms-3">${
        comm.createdAt
      }</span></div>
           <div class="delete ${
             currentUser.username == comm.user.username
               ? "d-inline-block"
               : "d-none"
           }"><i class="fas fa-trash-alt me-2"></i>Delete</div>
        </div>
        <div class="thoughts">
          ${comm.content}
        </div>
      </div>
      <div class="activity">
        <div class="likes ">
          <i class="far fa-thumbs-up me-2 like-btn"></i><span class="likes">${
            comm.likes
          }</span> Likes
        </div>
        
        <div class="reply ${
          currentUser.username != comm.user.username
            ? "d-inline-block"
            : "d-none"
        }" data-reply-to="${
        comm.user.username
      }" ><a href="#add-reply" class="d-block text-decoration-none">Reply</a></div>
        <div class="edit ${
          currentUser.username == comm.user.username
            ? "d-inline-block"
            : "d-none"
        }">Edit</div>
      </div>
    </div>
  </div>
</div>${
        comm.replies.length == 0 ? "" : renderReply(comm.replies, currentUser)
      }  `;
    })
    .join("")}
${getCommentBoxHTML("send", "send", "")}
</section> `;
  mainView.innerHTML = html;
  const sendBtn = document.querySelector(".send");
  sendBtn.addEventListener("click", () => {
    manageNewComment(comments, currentUser);
    renderFeedbackThread(feedbackData);
  });
  const replyBtns = document.querySelectorAll(".reply");
  replyBtns.forEach((reply) => {
    const { replyTo } = reply.dataset;
    reply.addEventListener("click", (e) => {
      const comment = e.target.closest(".comment");
      const commentBoxHTML = getCommentBoxHTML("submit-reply", "reply");
      comment.insertAdjacentHTML("afterend", commentBoxHTML);
      const commentBoxes = document.querySelectorAll(".comment-box");
      if (commentBoxes.length > 2) {
        if (comment.nextElementSibling == commentBoxes[0])
          commentBoxes[1].remove();
        else commentBoxes[0].remove();
      }
      const submitReplyBtn = document.querySelectorAll(".submit-reply");
      submitReplyBtn[0].addEventListener("click", () => {
        manageNewReply(comments, replyTo, currentUser, commentBoxes[0]);
        renderFeedbackThread(feedbackData);
      });
    });
  });
  const likeBtns = document.querySelectorAll(".like-btn");
  console.log(likeBtns);
}

function renderReply(replies, currentUser) {
  const html = `<div class="reply-container mb-3">
  <div class="vertical-line d-block me-4 ms-0 ms-sm-5"></div>
  <div class="comment-container">
   ${replies
     .map((reply) => {
       return ` 
    <div class="comment shadow-sm p-4">
      <div class="image">
        <img src="${reply.user.image}" alt="">
      </div>
      <div class="text-content">
        <div class="content mb-3">
          <div class="top mb-2">
            <div class="name">${reply.user.username}<span class="${
         currentUser.username == reply.user.username
           ? "d-inline-block"
           : "d-none"
       } you ms-2 px-2">you</span> <span class="time ms-3">${
         reply.createdAt
       }</span></div>
             <div class="delete ${
               currentUser.username == reply.user.username
                 ? "d-inline-block"
                 : "d-none"
             }"><i class="fas fa-trash-alt me-2"></i>Delete</div>
          </div>
          <div class="thoughts">
           <span class="me-1 replyingTo">@${reply.replyingTo}</span> ${
         reply.content
       }
          </div>
        </div>
        <div class="activity">
          <div class="likes ">
            <i class="far fa-thumbs-up me-2 like-btn"></i><span class="likes">${
              reply.likes
            }</span> Likes
          </div>
          <div class="reply ${
            currentUser.username != reply.user.username
              ? "d-inline-block"
              : "d-none"
          }" data-reply-to="${reply.user.username}">Reply</div>
          <div class="edit ${
            currentUser.username == reply.user.username
              ? "d-inline-block"
              : "d-none"
          }">Edit</div>
        </div>
      </div>
    </div>
  `;
     })
     .join("")} 
  </div>
  </div>`;

  return html;
}

function getCommentBoxHTML(btnType, btnText) {
 
  const html = ` <div class="comment-box shadow-sm p-4 w-100">
  <div class="image">
    <img src="https://randomuser.me/api/portraits/women/81.jpg" alt="">
  </div>
  <div class="text-area">
    <textarea id=""  class="text-field w-100 p-2" placeholder="Add your ${
      btnText == "send" ? "thoughts" : `${btnText}`
    }..." cols="" rows=""></textarea>
  </div>
  <div class="btn-container">
    <div class=" py-2 px-3 ${btnType} submit-btn">
    ${btnText.toUpperCase()}
    </div>
  </div>
</div> `;
  return html;
}

function manageNewComment(comments, currentUser) {
  const textField = document.querySelector(".text-field");
  const textVal = textField.value;
  if (textVal != "")
    comments.push({
      id: "",
      createdAt: "Today",
      likes: 0,
      content: `${textVal}`,
      user: {
        image: `${currentUser.image}`,
        username: `${currentUser.username}`,
      },
      replies: [],
    });
}

function manageNewReply(comments, replyTo, currentUser, replyBox) {
  const textField = document.querySelector(".text-field");
  if (!textField.value) {
    replyBox.remove();
    return;
  }
  let index = comments.findIndex((comm) => comm.user.username == replyTo);
  if (index == -1) {
    index = comments.findIndex(
      (comm) =>
        comm.replies.length > 0 && isUsernameMatched(comm.replies, replyTo)
    );
  }
  comments[index].replies.push({
    id: "",
    createdAt: "Today",
    likes: 0,
    content: `${textField.value}`,
    replyingTo: `${replyTo}`,
    user: {
      image: `${currentUser.image}`,
      username: `${currentUser.username}`,
    },
  });
}
function isUsernameMatched(replies, replyTo) {
  return replies.some((reply) => reply.user.username == replyTo);
}
