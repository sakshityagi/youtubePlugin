'use strict';

(function (angular) {
    angular
        .module('youtubePluginContent')
        .controller('ContentHomeCtrl', ['$scope', 'DataStore', 'ActionItems', 'TAG_NAMES', 'STATUS_CODE', 'CONTENT_TYPE', '$modal', '$http', 'YOUTUBE_KEYS','Utils',
            function ($scope, DataStore, ActionItems, TAG_NAMES, STATUS_CODE, CONTENT_TYPE, $modal, $http, YOUTUBE_KEYS, Utils) {
                var _data = {
                    "content": {
                        "images": [],
                        "description": '<p>&nbsp;<br></p>',
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
                ContentHome.masterData = null;
                ContentHome.CONTENT_TYPE = CONTENT_TYPE;
                ContentHome.data = angular.copy(_data);
                ContentHome.validLinkSuccess = false;
                ContentHome.validLinkFailure = false;
                ContentHome.contentType = CONTENT_TYPE.SINGLE_VIDEO;

                ContentHome.descriptionWYSIWYGOptions = {
                    plugins: 'advlist autolink link image lists charmap print preview',
                    skin: 'lightgray',
                    trusted: true,
                    theme: 'modern'
                };


                updateMasterItem(_data);

                function updateMasterItem(data) {
                    ContentHome.masterData = angular.copy(data);
                }

                function resetItem() {
                    ContentHome.data = angular.copy(ContentHome.masterData);
                }

                function isUnchanged(data) {
                    return angular.equals(data, ContentHome.masterData);
                }

                /**
                 * ContentHome.imageSortableOptions used for ui-sortable directory to drag-drop carousel images Manually.
                 * @type object
                 */
                ContentHome.imageSortableOptions = {
                    handle: '> .cursor-grab'
                };

                /*
                 * Go pull any previously saved data
                 * */
                var init = function () {
                    var success = function (result) {
                            ContentHome.data = result.data;
                            console.info('init success result:', result);
                            updateMasterItem(ContentHome.data);
                            if (tmrDelay)clearTimeout(tmrDelay);
                        }
                        , error = function (err) {
                            if (err && err.code !== STATUS_CODE.NOT_FOUND) {
                                console.error('Error while getting data', err);
                                if (tmrDelay)clearTimeout(tmrDelay);
                            }
                            else if (err && err.code === STATUS_CODE.NOT_FOUND) {
                                saveData(JSON.parse(angular.toJson(ContentHome.data)), TAG_NAMES.YOUTUBE_INFO);
                            }
                        };
                    DataStore.get(TAG_NAMES.YOUTUBE_INFO).then(success, error);
                };
                init();

                /*
                 * Call the datastore to save the data object
                 */
                var saveData = function (newObj, tag) {
                    if (typeof newObj === 'undefined') {
                        return;
                    }
                    var success = function (result) {
                            console.info('Saved data result: ', result);
                            updateMasterItem(newObj);
                        }
                        , error = function (err) {
                            console.error('Error while saving data : ', err);
                        };
                    DataStore.save(newObj, tag).then(success, error);
                };

                /*
                 * create an artificial delay so api isnt called on every character entered
                 * */
                var tmrDelay = null;
                var saveDataWithDelay = function (newObj) {
                    if (newObj) {
                        if (isUnchanged(newObj)) {
                            return;
                        }
                        if (tmrDelay) {
                            clearTimeout(tmrDelay);
                        }
                        tmrDelay = setTimeout(function () {
                            saveData(JSON.parse(angular.toJson(newObj)), TAG_NAMES.YOUTUBE_INFO);
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
                /*                */
                /*
                 * this is a way you can update only one property without sending the entire object
                 * */
                /*
                 $scope.approve = function () {
                 if ($scope.id)
                 buildfire.datastore.update($scope.id, {$set: {"content.approvedOn": new Date()}});
                 };


                 */
                /*
                 $scope.resizeImage = function (url) {
                 if (!url)
                 return "";
                 else
                 return buildfire.imageLib.resizeImage(url, {width: 32});
                 };*/
                /*------------------------------------------previous code ends-----------------------------*/

                ContentHome.openAddImagePopUp = function () {
                    var modalInstance = $modal
                        .open({
                            templateUrl: 'templates/modals/add-carousel-image.html',
                            controller: 'AddCarouselImagePopupCtrl',
                            controllerAs: 'AddCarouselImagePopup',
                            size: 'sm'
                        });
                    modalInstance.result.then(function (imageInfo) {
                        if (imageInfo && ContentHome.data) {
                            if (!ContentHome.data.content.images)
                                ContentHome.data.content.images = [];
                            ContentHome.data.content.images.push(JSON.parse(angular.toJson(imageInfo)));
                        } else {
                            console.info('Unable to load data.')
                        }
                    }, function (err) {
                        //do something on cancel
                    });
                };

                /**
                 * ContentHome.removeCarouselImage($index) used to remove a carousel image
                 * @param $index is the index of carousel image to be remove.
                 */
                ContentHome.removeCarouselImage = function ($index) {
                    var modalInstance = $modal
                        .open({
                            templateUrl: 'templates/modals/remove-image.html',
                            controller: 'RemoveImagePopupCtrl',
                            controllerAs: 'RemoveImagePopup',
                            size: 'sm',
                            resolve: {
                                imageInfo: function () {
                                    return ContentHome.data.content.images[$index]
                                }
                            }
                        });
                    modalInstance.result.then(function (data) {
                        if (data)
                            ContentHome.data.content.images.splice($index, 1);
                    }, function (data) {
                        //do something on cancel
                    });
                };


                ContentHome.addActionForImage = function (index) {
                    var options = {showIcon: false}
                        , success = function (result) {
                            if (ContentHome.data.content.images[index])
                                ContentHome.data.content.images[index].action = result;
                        }
                        , error = function (error) {
                            console.error('ContentHome.addActionForImage Error:', error);
                        };
                    ActionItems.showDialog(null, options).then(success, error);
                };

                ContentHome.editActionForImage = function (action, index) {
                    var options = {showIcon: false}
                        , success = function (result) {
                            if (ContentHome.data.content.images[index])
                                ContentHome.data.content.images[index].action = result;
                        }
                        , error = function (error) {
                            console.error('ContentHome.editActionForImage Error:', error);
                        };
                    ActionItems.showDialog(action, options).then(success, error);
                };

                // Function to validate youtube rss feed link entered by user.

                ContentHome.validateRssLink = function () {
                    console.log(ContentHome.contentType);
                    switch (ContentHome.contentType) {
                        case CONTENT_TYPE.SINGLE_VIDEO :
                            var videoID = Utils.extractSingleVideoId(ContentHome.rssLink);
                            if (videoID) {
                                $http.get("https://www.googleapis.com/youtube/v3/videos?part=snippet&id=" + videoID + "&key=" + YOUTUBE_KEYS.API_KEY)
                                    .success(function (response) {
                                        console.log(response);
                                        if (response.items && response.items.length) {
                                            ContentHome.validLinkSuccess = true;
                                            ContentHome.validLinkFailure = false;
                                            ContentHome.data.content.rssUrl = ContentHome.rssLink;
                                            ContentHome.data.content.type = ContentHome.contentType;
                                            ContentHome.data.content.videoID = videoID;
                                            ContentHome.data.content.playListID = null;
                                        }
                                        else {
                                            ContentHome.validLinkFailure = true;
                                            ContentHome.validLinkSuccess = false;
                                        }
                                    })
                                    .error(function () {
                                        ContentHome.validLinkFailure = true;
                                        ContentHome.validLinkSuccess = false;
                                    });
                            }
                            else {
                                ContentHome.validLinkFailure = true;
                                ContentHome.validLinkSuccess = false;
                            }
                            break;
                        case CONTENT_TYPE.CHANNEL_FEED :
                          var feedIdAndType = Utils.extractChannelId(ContentHome.rssLink);
                          var feedApiUrl = null;
                          console.log(feedIdAndType);
                          if (feedIdAndType) {
                            if (feedIdAndType.channel)
                              feedApiUrl = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&id=" + feedIdAndType.channel + "&key=" + YOUTUBE_KEYS.API_KEY;
                            else if (feedIdAndType.user || feedIdAndType.c)
                              feedApiUrl = "https://www.googleapis.com/youtube/v3/channels?part=contentDetails&forUsername=" + (feedIdAndType.user || feedIdAndType.c) + "&key=" + YOUTUBE_KEYS.API_KEY;
                            $http.get(feedApiUrl)
                              .success(function (response) {
                                console.log(response);
                                if (response.items && response.items.length) {
                                  ContentHome.validLinkSuccess = true;
                                  ContentHome.validLinkFailure = false;
                                  ContentHome.data.content.rssUrl = ContentHome.rssLink;
                                  ContentHome.data.content.type = ContentHome.contentType;
                                  if(response.items[0].contentDetails && response.items[0].contentDetails.relatedPlaylists && response.items[0].contentDetails.relatedPlaylists.uploads)
                                  ContentHome.data.content.playListID = response.items[0].contentDetails.relatedPlaylists.uploads;
                                  ContentHome.data.content.videoID = null;
                                }
                                else {
                                  ContentHome.validLinkFailure = true;
                                  ContentHome.validLinkSuccess = false;
                                }
                              })
                              .error(function () {
                                ContentHome.validLinkFailure = true;
                                ContentHome.validLinkSuccess = false;
                              });
                          }
                        else {
                            ContentHome.validLinkFailure = true;
                            ContentHome.validLinkSuccess = false;
                          }
                    }
                };
            }]);
})(window.angular);
