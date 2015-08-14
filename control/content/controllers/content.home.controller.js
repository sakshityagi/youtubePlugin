'use strict';

(function (angular, window) {
    angular
        .module('youtubePluginContent')
        .controller('ContentHomeCtrl', ['$scope', 'Buildfire', 'TAG_NAMES', 'ERROR_CODE',
            function ($scope, Buildfire, TAG_NAMES, ERROR_CODE) {
                var _imageData = {
                    "url": "",
                    "title": "",
                    "link": ""
                };
                var _data = {
                    "content": {
                        "images": [],
                        "description": "",
                        "rssUrl": "",
                        "type": ""
                    },
                    "design": {
                        "itemListLayout": "",
                        "itemListBgImage": "",
                        "itemDetailsBgImage": ""
                    }
                };
                var ContentHome = this;
                ContentHome.data = null;

                /*
                 * Go pull any previously saved data
                 * */
                var init = function () {
                    Buildfire.datastore.get(TAG_NAMES.GET_INFO, function (err, result) {
                        if (err && err.code !== ERROR_CODE.NOT_FOUND) {
                            console.error('-----------err-------------', err);
                            if (tmrDelay)clearTimeout(tmrDelay);
                        }
                        else if (err && err.code === ERROR_CODE.NOT_FOUND) {
                            saveData(JSON.parse(angular.toJson(_data)), TAG_NAMES.GET_INFO);
                        }
                        else if (result) {
                            ContentHome.data = result.data;
                            console.info('------------Data-------', result);
                            $scope.$digest();
                            if (tmrDelay)clearTimeout(tmrDelay);
                        }
                    });
                };
                init();

                /*
                 * Call the datastore to save the data object
                 */
                var saveData = function (newObj, tag) {
                    if (typeof newObj === 'undefined')return;
                    Buildfire.datastore.save(newObj, tag, function (err, result) {
                        if (err || !result) {
                            console.error('------------error saveData-------', err);
                        }
                    });
                };

                /*
                 * create an artificial delay so api isnt called on every character entered
                 * */
                var tmrDelay = null;
                var saveDataWithDelay = function (newObj) {
                    if (newObj) {
                        if (tmrDelay) {
                            clearTimeout(tmrDelay);
                        }
                        tmrDelay = setTimeout(function () {
                            saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.GET_INFO);
                        }, 500);
                    }
                };
                /*
                 * watch for changes in data and trigger the saveDataWithDelay function on change
                 * */
                $scope.$watch(function () {
                    return ContentHome.data;
                }, saveDataWithDelay, true);

                /*------------------------------------------related to previous code-----------------------------*/

                /*
                 * this is a way you can update only one property without sending the entire object
                 * */
                $scope.approve = function () {
                    if ($scope.id)
                        buildfire.datastore.update($scope.id, {$set: {"content.approvedOn": new Date()}});
                };


                /*
                 * Open Image Lib
                 */
                $scope.openImageLib = function () {
                    buildfire.imageLib.showDialog({showIcons: false, multiSelection: false}, function (error, result) {
                        if (result && result.selectedFiles && result.selectedFiles.length > 0) {
                            $scope.data.content.bgURL = result.selectedFiles[0];
                            $scope.$apply();
                        }
                    });
                };

                /*
                 * Open action dialog
                 */
                $scope.openActionDialog = function () {
                    var actionItem = {
                        title: "build fire",
                        "url": "https://www.facebook.com/buildfireapps",
                        action: "linkToWeb",
                        openIn: "browser",
                        actionName: "Link to Web Content"
                    };
                    var options = {showIcon: true};
                    buildfire.actionItems.showDialog(null, options, function (err, actionItem) {
                        if (err)
                            console.log(err);
                        else {
                            debugger;
                            if (!$scope.data.actionItems)
                                $scope.data.actionItems = [];
                            $scope.data.actionItems.push(actionItem);
                            $scope.$apply();
                        }

                    });
                };

                $scope.resizeImage = function (url) {
                    if (!url)
                        return "";
                    else
                        return buildfire.imageLib.resizeImage(url, {width: 32});
                };
                /*------------------------------------------previous code ends-----------------------------*/

            }]);
})(window.angular, window);
