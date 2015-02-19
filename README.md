Jon Sorrells, assignment 3, cs4802

To view the output, go to http://jlsorrells.github.io/cs4802a3/  

data from http://archive.ics.uci.edu/ml/datasets/Breast+Cancer+Wisconsin+%28Diagnostic%29  
parallel coordinates code modified from an example at http://bl.ocks.org/jasondavies/1341281 

This program uses parallel coordinates to display the data.  It shows all 10 attributes that were measured.  To switch between displaying the average values, maximum values, and standard errors, use the drop down menu.  
The lines are color coded based on the diagnosis, blue for benign and red for malignant.  
The program will work fine with additional rows of data.  Additional columns of data should work as long as there is one column for mean, one for max, and one for standard error.  

Technical additions: 
The program is able to switch between showing the mean, max or standard error sections of the data.  It does this by looking through the currently displayed dimensions (radius, texture, etc.) and the desired type of data (mean, max or standard error), and picking the data attribute that fits both of those.  This allows for switching between, for example, average values and maximum values, while still keeping the columns in the same order.  

Biological additions:
The program displays a counter to show how many selected records are benign and how many are malignant.  This is useful for checking how likely another cell is to be part of a malignant tumor.  For example, if you select the radius axis between 14 and 16, you can see that about half are benign and half are malignant, but selecting a radius between 16 and 18 shows that almost all are malignant.  
