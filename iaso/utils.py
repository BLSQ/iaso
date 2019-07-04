from bs4 import BeautifulSoup as Soup

def parseChildren(el):
    xmlDict = {}
    for children in el.findChildren(None, {}, False):
        if len(children.findChildren(None, {}, False)) > 0:
            xmlDict[children.name] = parseChildren(children)
        else:
            xmlDict[children.name] = children.text
    return xmlDict

def parseXMLFile(file):
    soup = Soup(file.read(), features="html.parser")
    return parseChildren(soup)
