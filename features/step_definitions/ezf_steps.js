'use strict';
var assert = require('assert');
var wd = require('wd');
var WebdriverManager = require('webdriver-manager');
var stepDefinitions = function() {


    this.Given(/^I have the application open and running$/, {timeout: 20 * 1000}, function (callback) {
        var self = this;
        this.wm = new WebdriverManager();
        this.wm.start({closeOnStdinInput: false}, function(err){
            if(err){return callback.fail(err); }
            self.browser = wd.remote();
            self.browser.init({
                browserName: 'chrome',
                chromeOptions:{
                    binary: '/usr/local/bin/nw'
                }
            }, callback);
        });
    });

    this.When(/^I click on the "([^"]*)" button$/, function (button, callback) {
        this.browser.elementById(button, function(err, element){
            assert.equal(null, err);
            callback(err);
        });
    });

    this.When(/^I choose "([^"]*)"$/, function (filename, callback) {
        this.browser.elementById("fileDialog", function(err, element){
            assert.equal(null, err);
            element.sendKeys(filename, callback);
        });
    });

    this.Then(/^I should open "([^"]*)" and see the results$/, function (filename, callback) {
        //callback.pending(); //window undefined error
        var browser = this.browser;
        browser.elementById("fileDialog", function(err, element){
            browser.execute('$("#fileDialog").toggle();');
            element.sendKeys(filename);
            //element.click(callback);
        });
    });

}

module.exports = stepDefinitions;