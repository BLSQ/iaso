from bs4 import BeautifulSoup as Soup


def getflatChildrenTree(el, flatXmlDict):
    for children in el.findChildren(None, {}, False):
        if len(children.findChildren(None, {}, False)) > 0:
            getflatChildrenTree(children, flatXmlDict)
        else:
            flatXmlDict[children.name] = children.text


def getChildrenTree(el):
    xmlDict = {}
    for children in el.findChildren(None, {}, False):
        if len(children.findChildren(None, {}, False)) > 0:
            xmlDict[children.name] = getChildrenTree(children)
        else:
            xmlDict[children.name] = children.text
    return xmlDict

def parseXMLFile(file):
    soup = Soup(file.read(), features="html.parser")
    return getChildrenTree(soup)

def flatParseXMLFile(file):
    soup = Soup(file.read(), features="html.parser")
    flatXmlDict = {}
    getflatChildrenTree(soup, flatXmlDict)
    print (flatXmlDict)
    return flatXmlDict
