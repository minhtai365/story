var express = require('express');

// const fetch = require("node-fetch");
const jsdom = require("jsdom");
const { JSDOM } = jsdom;
var router = express.Router();

// /* GET home page. */

// /**
//  * Small wrapper method for getting the actual HTML content of a website
//  * @param {string} url The URL to get the HTML for
//  * @return {Promise<string>} The HTML content as string
//  */
// const getWebsiteContent = async (url) => {
//     // Simple HTTP call
//     const content = fetch(url);
//     // Parsing to result as text
//     return content.text();
// };

// /**
//  * Scraper method which tries to get the value of an input element defined by the
//  * provided 'cssSelector' on the provided 'url'
//  * @param {string} url The URL to be crawled
//  * @param {string} cssSelector The selector to apply to find the input element
//  * @return {Promise<string | null | undefined>} The value of the found input element, if found
//  */
// const scrape = async (url, cssSelector)=> {
//     // Get the HTML of the URL
//     const websiteHtml = await getWebsiteContent(url);
//     // Create JSDOM to have a virtual DOM we can query
//     const dom = new JSDOM(websiteHtml);
//     const doc = dom.window.document;
//     // Search for the input element we want the value for and return it's value
//     return (doc.querySelector(cssSelector));
// };

// /**
//  * Simple main method to set up the parameters for our scraping
//  * and posting its result
//  */
// const main = async ()=> {
//     // Prepare our variables
//     const url = 'https://www.google.com';
//     const cssSelector = 'form input[type=submit]';
//     // Run the Crawler
//     const scrapeResult= await scrape(url, cssSelector);
//     // Print the parameters + result
//     console.log('---------------------');
//     console.log(`Crawling URL: '${url}'`);
//     console.log(`CSS Selector : '${cssSelector}'`);
//     console.log('---------------------');
//     console.log(`Result: '${scrapeResult}'\n`);
// };

router.get('/', function(req, res, next) {

  res.render('index', { title: 'Express' });
});

module.exports = router;
