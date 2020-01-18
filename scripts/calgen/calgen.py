#!/usr/bin/python3
"""
This is a ICS (icalendar/RFC Blah) to yaml-front-matter parser

It autogenerates files and dumps them out

It uses the UID to "update" files (i.e. erase and update them)
"""

import urllib.request
import argparse
import icalendar
import os
import datetime
import pyaml

parser = argparse.ArgumentParser(description='Process ICS feed to YAML-Front-Matter file')
parser.add_argument("url", help="URL Source of ICS feed")
parser.add_argument("output_dir", help="Directory to output to")
args = parser.parse_args()

resp = urllib.request.urlopen(args.url)

data = resp.read().decode()

cal = icalendar.Calendar.from_ical(data)

out_dir = os.path.abspath(args.output_dir)

if not os.path.isdir(out_dir):
    try:
        os.mkdir(args.output_dir) # Ensure output dir exists
    except:
        print("Failed to make dir")
        exit(1)

pubdate = datetime.datetime.now().isoformat()

for event in cal.walk("VEVENT"):
    if "DESCRIPTION" in event:
        content = str(event["DESCRIPTION"])
    else:
        content = str(event["SUMMARY"])
    frontmatter = {}
    frontmatter["title"]=str(event["SUMMARY"])
    frontmatter["datetime"]=event["DTSTART"].dt.isoformat()
    frontmatter["pubdate"]=pubdate
    frontmatter["category"]=str(event["CATEGORIES"].cats[0])
    if "DTEND" in event: 
        frontmatter["dtend"]=event["DTEND"].dt.isoformat()
    frontmatter["image"]='https://ucarecdn.com/f70e55f2-7fc9-4df8-b536-4e42e1cb31b0/'
    if "LOCATION" in event:
        frontmatter["location"]=str(event["LOCATION"])
        content = "Location: " + str(event["LOCATION"]) + "\n\n" + content
    if "RRULE" in event:
        frontmatter["rrule_freq"]=str(event["RRULE"]["FREQ"][0])
        frontmatter["rrule_count"]=str(event["RRULE"]["COUNT"][0])
    filename = str(event["UID"]) + "_" + str(event["SUMMARY"]).replace(" ", "-").replace("/", "-").replace("\\", "-") + ".md"
    filename = os.path.join(out_dir, filename)

    with open(filename, "w+") as f:
        f.write("---\n")
        f.write(pyaml.dump(frontmatter))
        f.write("---\n")
        f.write(content)