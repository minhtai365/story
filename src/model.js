const path = require("path");
const axios = require("axios");
const { JSDOM } = require("jsdom");
const { LIMIT } = require("./constants");
const { toSlug, encodeString } = require("./utils");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const instance = axios.create({
  baseURL: process.env.API_URL,
  headers: {
    "X-Requested-With": "XMLHttpRequest",
    Referer: "https://vuighe.net/idoly-pride"
  }
});

const WEBSITE_URL = process.env.WEBSITE_URL;

class Model {
  static async slide() {
    const URL = WEBSITE_URL;

    const { data } = await axios.get(URL);

    const { window } = new JSDOM(data);
    const { document } = window;

    const slideItems = document.querySelectorAll(".slider-item");

    const list = [...slideItems].map(item => {
      const thumbnail = item.querySelector(".slider-item-img").dataset.src;
      const title = item.dataset.title;
      const views = item.dataset.views;
      const slug = toSlug(title);

      return { thumbnail, slug, views, name: title };
    });

    return list;
  }

  static async getEpisode(animeId, episodeIndex) {
    const episodes = await this.getEpisodes(animeId);
    const episode = episodes[episodeIndex];

    const sources = await this.getSource(animeId, episode.id);

    return { ...episode, ...sources };
  }

  static async search(keyword, limit = LIMIT) {
    const URL = `/search?q=${encodeURIComponent(keyword)}&limit=${limit}`;
    const { data } = await instance.get(URL);

    const list = data.data.map(anime => {
      const { meta, time, ...info } = anime;

      const animeTime = !info.is_movie
        ? `${meta.max_episode_name}/${time}`
        : time;

      return { ...info, time: animeTime };
    });

    return { data: list, total: list.length };
  }

  static async getEpisodes(animeId) {
    const URL = `/films/${animeId}/episodes?sort=name`;
    console.log(URL);
    const { data } = await instance.get(URL);
    console.log(data);
    const episodes = data.data.filter(episode => !episode.special_name);

    return episodes;
  }

  static async getSource(animeId, episodeId) {
    const { data } = await instance.get(
      `/films/${animeId}/episodes/${episodeId}`
    );
    // https://animetv-server.vercel.app/
    const CORS_API = "api/v1/cors";

    const sources = data.sources;
      console.log(data);
    // if (Array.isArray(sources.m3u8) ? !sources.m3u8.length : !sources.m3u8) {
      const whitelistKeys = [];

      const sourceKey = Object.keys(sources)
        .filter(key => !whitelistKeys.includes(key))
        .find(key => !!sources[key].length);

      let source = sources[sourceKey][0].src;

      if (sourceKey === "vip") {
        source = `${CORS_API}/${source}`;
      }

      return {
        videoSource: source
      };
    // }

    // const m3u8Source = sources.m3u8;
    // const source =
    //   m3u8Source.hls || m3u8Source.sd || m3u8Source[Object.keys(m3u8Source)[0]];

    // const m3u8 = encodeString(source);

    // const m3u8P = m3u8.replace("vdicdn.com", "mephimanh.com").split("/")[4];

    // const vSource = `https://ima21.xyz/hls/${m3u8P}/playlist.m3u8`;

    // return {
    //   videoSource: vSource
    // };
  }

  static async getComments(animeId, offset, limit = LIMIT) {
    const { data } = await instance.get(
      `/films/${animeId}/comments?limit=${limit}&offset=${offset}`
    );

    return data.data;
  }

  static async getRanking(slug) {
    const { data } = await axios.get(`${WEBSITE_URL}/bang-xep-hang/${slug}`);

    return parseList(data);
  }

  static async getInfo(slug) {
    const scrapedInfo = await scrapeInfo(slug);

    const episodes = await this.getEpisodes(scrapedInfo.id);

    return { ...scrapedInfo, episodes };
  }

  static async recommended() {
    const { data } = await axios.get(`${WEBSITE_URL}/hom-nay-xem-gi`);

    return parseList(data);
  }

  static async recentlyUpdated() {
    const { data } = await axios.get(`${WEBSITE_URL}/tap-moi-nhat`);

    return parseList(data);
  }

  static async scrapeInfo(slug) {
    const { data } = await axios.get(`${WEBSITE_URL}/${slug}`);

    const { window } = new JSDOM(data);
    const { document } = window;

    const genresElement = document.querySelectorAll(".film-info-genre a");
    const subTeamsElement = document.querySelectorAll(".film-info-subteam a");

    const genres = [...genresElement].map(genre => {
      const name = genre.textContent;
      const url = genre.getAttribute("href");
      const slug = urlToSlug(url);

      return { name, url, slug };
    });

    const subTeams = [...subTeamsElement].map(team => team.textContent);

    const description = document.querySelector(".film-info-description")
      .textContent;

    return { genres, subTeams, description };
  }

  static async getGenre(genre, page = 1) {
    const URL = `${WEBSITE_URL}/anime/${genre}/trang-${page}`;
    console.log('123');
    const { data } = await axios.get(URL);

    const { window } = new JSDOM(data);
    const { document } = window;

    const total = document
      .querySelector('[name="total-item"]')
      .getAttribute("value");

    const list = parseList(data);

    return { data: list, total: Number(total) };
  }
}

const urlToSlug = url => {
  const parts = url.split("/");

  return parts[parts.length - 1];
};

const getInfo = async slug => {
  const { data } = await instance.get("/search", {
    params: {
      q: slug,
      limit: 1
    }
  });

  const { meta, time, ...info } = data.data[0];

  const animeTime = !info.is_movie ? `${meta.max_episode_name}/${time}` : time;

  return { ...info, time: animeTime };
};

const addInfo = async list => {
  const promises = await Promise.allSettled(
    list.map(async anime => {
      const info = await getInfo(anime.slug);

      let returnObj = { ...anime, ...info };

      if (!anime.description) {
        const scrapedInfo = await scrapeInfo(anime.slug);
        returnObj = { ...returnObj, ...scrapedInfo };
      }

      return returnObj;
    })
  );

  return promises
    .filter(promise => promise.status === "fulfilled")
    .map(promise => promise.value);
};

const scrapeInfo = async slug => {
  const { data } = await axios.get(`${WEBSITE_URL}/${slug}`);

  const { window } = new JSDOM(data);
  const { document } = window;

  const genresElement = document.querySelectorAll(".film-info-genre a");
  const subTeamsElement = document.querySelectorAll(".film-info-subteam a");

  const genres = [...genresElement].map(genre => {
    const name = genre.textContent;
    const url = genre.getAttribute("href");
    const slug = urlToSlug(url);

    return { name, url, slug };
  });

  const { id, name } = document.querySelector(".container.play").dataset;

  const subTeams = [...subTeamsElement].map(team => team.textContent);

  const description = document.querySelector(".film-info-description")
    .textContent;

  const views = parseViews(
    document.querySelector(".film-info-views").textContent
  );

  const thumbnail = document
    .querySelector('[property="og:image"]')
    .getAttribute("content");

  return {
    genres,
    subTeams,
    description,
    id: Number(id),
    name,
    views,
    thumbnail,
    slug
  };
};

const parseViews = text => {
  if (!text) return;

  return Number(text.replace("lượt xem", "").replace(/,/g, ""));
};

const parseList = html => {
  const { window } = new JSDOM(html);
  const { document } = window;

  const items = document.querySelectorAll(".tray-item a");

  const list = [...items].map(item => {
    const url = item.getAttribute("href");

    const slug = urlToSlug(url.split("/")[1]);

    const thumbnail = item.querySelector(".tray-item-thumbnail").dataset.src;
    const time = item
      .querySelector(".tray-film-update")
      ?.textContent.replace(" / ", "/");
    const latestEpisode = {
      name: item.querySelector(".tray-episode-name")?.textContent,
      views: parseViews(item.querySelector(".tray-episode-views")?.textContent)
    };
    const name = item.querySelector(".tray-item-title")?.textContent;
    const views = parseViews(
      item.querySelector(".tray-film-views")?.textContent
    );

    return { slug, views, name, time, latestEpisode, thumbnail };
  });

  return list;
};

module.exports = Model;
