echo "===================appcenter-pre-clone.sh==================="
set -ex
# change global node used by metro
brew uninstall node@6
NODE_VERSION="10.9.0"
curl "https://nodejs.org/dist/v${NODE_VERSION}/node-v${NODE_VERSION}.pkg" > "$HOME/Downloads/node-installer.pkg"
sudo installer -store -pkg "$HOME/Downloads/node-installer.pkg" -target "/"

# change npm version
sudo npm i -g npm@6.12.0

# remove .npmrc and don't use npm of nexus on ci
rm ${APPCENTER_SOURCE_DIRECTORY}/.npmrc

# remove package-lock.json because ci don't need lock
rm ${APPCENTER_SOURCE_DIRECTORY}/package-lock.json

# package-ci.json is only for appcenter and please maintain it while package.json changes.(please make sure there is no ^ in the package.json)
mv ${APPCENTER_SOURCE_DIRECTORY}/package-ci.json ${APPCENTER_SOURCE_DIRECTORY}/package.json

node --version
npm --version