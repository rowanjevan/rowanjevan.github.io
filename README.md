# Rowan Jevan Portfolio

This is a static website ready for GitHub Pages. No install, build, API key, AWS account, or server is required.

## Publish with GitHub Pages

1. Create a PUBLIC GitHub repository named YOURUSERNAME.github.io, replacing YOURUSERNAME with your GitHub username. If you already have that repository, use a new repository such as portfolio instead.
2. Unzip this download on your computer.
3. In your GitHub repository, use Add file > Upload files. Upload the extracted files directly into the repository root. Do not upload the ZIP or nest the files inside another folder. index.html should be immediately visible in the repository's main file list.
4. Commit the upload to the main branch. If you initialized the repository with a README, replace that starter README with this one or omit this README from the upload.
5. Go to Settings > Pages. Under Source, choose Deploy from a branch. Select main and /(root), then Save.
6. Wait for the deployment. GitHub says this can take up to 10 minutes. The Pages settings will display your public website URL.

For a repository named YOURUSERNAME.github.io, the URL is https://YOURUSERNAME.github.io/.
For a repository named portfolio, the URL is https://YOURUSERNAME.github.io/portfolio/.

An empty .nojekyll file is included. If your computer hides it, you can create it with Add file > Create new file on GitHub. The website also uses standard filenames that work with GitHub Pages' default processing.

## Files

- index.html: page shell and navigation
- style.css: layout, design, and animations
- app.js: portfolio content and page navigation
- simulation.js: browser-based stock simulation and chart
- aapl-data.json: historical training and comparison data
- AAPL.csv: downloadable training data
- AAPL-comparison.csv: downloadable actual-price comparison data
- ResearchPaper.pdf: downloadable M&A research paper

The simulation generates 100 paths for October 29, 2025 through October 29, 2026. It runs in each visitor's browser. The actual-price comparison is fixed historical data, not a live market feed. Links and data paths are relative so the site works at either type of GitHub Pages URL.

## Updating later

Edit or replace the files in your GitHub repository and commit changes. GitHub Pages republishes from main. Changes made to the separate ChatGPT-hosted copy do not automatically update this GitHub copy.

## Local preview

From this folder, run: python3 -m http.server 8000
Then open http://localhost:8000 in a browser. Opening index.html directly as a file can block the simulation's JSON request.

## Official instructions

https://docs.github.com/en/pages/quickstart
https://docs.github.com/en/pages/getting-started-with-github-pages/configuring-a-publishing-source-for-your-github-pages-site
