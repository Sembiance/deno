#!/usr/bin/tclsh

# SOURCE: https://gist.github.com/gingerbeardman/4a3b66236e018b72b32ca17953474e12

set ver {2021.12.02}
set author {Matt Sephton @gingerbeardman}

package require cmdline

set parameters {
	{encoding.arg	macJapan	"source encoding, default:"}
	{list	"list encodings"}
	{version	"show version info"}
}

set usage {[-encoding value] ...

Convert legacy text encodings to Unicode (UTF-8)

... single or multiple files, directories, wildcards, or omit to use stdin
}

if {[catch {array set options [cmdline::getoptions ::argv $parameters $usage]}]} {
	puts [cmdline::usage $parameters $usage]
}

proc convertTextToUnicode {enc f} {
	if {[file isdirectory $f]} {
		foreach g [glob -nocomplain [file join $f *]] {
			convertTextToUnicode $enc $g
		}
	} else {
		# open
		if {$f == "stdin"} {
			set in stdin
			set out stdout
		} else {
			set in [open $f rb]
			set out [open $f.new w]
			set datestamp [file mtime $f]
		}

		# make sure input is treated as binary
		fconfigure $in -translation binary

		# do the encoding conversion
		puts $out [encoding convertfrom $enc [read $in]]

		# close and cleanup
		if {$in != "stdin"} {
			close $in
			close $out
			file rename -force $f.new $f
			file mtime $f $datestamp
		}
	}
}

# show version
if {[array size options] > 0 && $options(version) == 1} {
	puts "convert2unicode ($ver) by $author"
	exit
}

# list encodings
if {[array size options] > 0 && $options(list) == 1} {
	puts "List of known encodings:\n"
	set lst [lsort -dictionary [split [encoding names] " "]]
	foreach word $lst {
		puts $word
	}
	exit
}

# default source encoding
if {[array size options] > 0 && $options(encoding) != ""} {
	set enc $options(encoding)
}

# no files passed
if {$argc == 0 || ($argc == 2 && [array size argv] == 0)} {
	convertTextToUnicode $enc stdin
} else {
	# process each command-line argument
	foreach f $argv {
		if {[file isfile $f] || [file isdirectory $f]} {
			convertTextToUnicode $enc $f
		} else {
			puts stderr "error: cannot find \"$f\""
		}
	}
}
