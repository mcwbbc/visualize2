Feature: Ezf
  In order to open an EZF file rgar U'm currently interested in
  As a User
  I want to open an EZF file from the application

  Scenario: Open an EZF file
    Given I have the application open and running
    When I click on the "open" button
    #And I see a file dialog
    And I choose "/Users/andrew/WebstormProjects/Martin_CA_1.ez2"
    Then I should open "/Users/andrew/WebstormProjects/Martin_CA_1.ez2" and see the results