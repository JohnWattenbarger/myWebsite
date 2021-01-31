
class Header {

    static openup() {
        let header = Header.getHeader();
        let linksBar = header.getElementsByClassName("linksBar")[0];

        linksBar.classList.toggle("showing");
    }

    static getHeader() {
        let header = document.getElementsByClassName("header")[0];
        return header;
    }
}